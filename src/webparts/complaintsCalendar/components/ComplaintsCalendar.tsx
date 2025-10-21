import * as React from 'react';
import styles from './ComplaintsCalendar.module.scss';
import type { IComplaintsCalendarProps } from './IComplaintsCalendarProps';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';import GridComplaints from './GridComplaints';



// Helper function to pad strings
function padStart(str: string, targetLength: number, padString: string = '0'): string {
  if (str.length >= targetLength) return str;
  let pad = '';
  const padLength = targetLength - str.length;
  for (let i = 0; i < padLength; i++) {
    pad += padString;
  }
  return pad + str;
}

// Helper function to format date from yyyy-mm-dd to dd/mm/yyyy
function formatDateToDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthMatrix(date: Date): { year: number; monthIndex: number; monthName: string; weeks: (number | null)[][] } {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const monthName = date.toLocaleString(undefined, { month: 'long' });

  const firstOfMonth = new Date(year, monthIndex, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: (number | null)[] = [];
  // leading blanks
  for (let i = 0; i < startDay; i++) cells.push(null);
  // month days
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // trailing blanks to complete weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { year, monthIndex, monthName, weeks };
}

interface CalendarData {
  dateCounts: Map<string, number>;
  loading: boolean;
  error: string | null;
}

const ComplaintsCalendar: React.FC<IComplaintsCalendarProps> = (props) => {
  // State for current month being displayed
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    // Start with October 2025 for testing, but can be changed to new Date() for production
    return new Date(2025, 9, 1); // October 2025 (month is 0-indexed)
  });
  
  const today = new Date(); // Keep actual today for highlighting
  const model = React.useMemo(() => getMonthMatrix(currentMonth), [currentMonth.getFullYear(), currentMonth.getMonth()]);
  
  console.log('Calendar model:', { 
    year: model.year, 
    monthIndex: model.monthIndex, 
    monthName: model.monthName,
    currentDate: currentMonth.toISOString()
  });

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      console.log('Navigating to previous month:', newDate.toISOString());
      return newDate;
    });
    setSelectedDate(null); // Clear selection when changing months
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      console.log('Navigating to next month:', newDate.toISOString());
      return newDate;
    });
    setSelectedDate(null); // Clear selection when changing months
  };

  
  const [calendarData, setCalendarData] = React.useState<CalendarData>({
    dateCounts: new Map(),
    loading: false,
    error: null
  });

  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Debug selectedDate changes
  React.useEffect(() => {
    console.log('=== SELECTED DATE STATE CHANGED ===');
    console.log('New selectedDate:', selectedDate);
    console.log('SelectedDate type:', typeof selectedDate);
    console.log('========================');
  }, [selectedDate]);

  // Debug when calendar data changes
  React.useEffect(() => {
    console.log('Calendar data changed:', {
      dateCountsSize: calendarData.dateCounts.size,
      loading: calendarData.loading,
      error: calendarData.error,
      availableKeys: Array.from(calendarData.dateCounts.keys())
    });
  }, [calendarData]);

  // Auto-select today's date if it has data and no date is currently selected
  React.useEffect(() => {
    if (!selectedDate && !calendarData.loading && calendarData.dateCounts.size > 0) {
      const todayKey = `${today.getFullYear()}-${padStart(String(today.getMonth() + 1), 2)}-${padStart(String(today.getDate()), 2)}`;
      const todayCount = calendarData.dateCounts.get(todayKey);
      
      console.log('Auto-selection check:', {
        todayKey,
        todayCount,
        currentMonth: currentMonth.getFullYear() + '-' + (currentMonth.getMonth() + 1)
      });
      
      // Only auto-select if today is in the current month and has data
      if (todayCount && todayCount > 0 && 
          today.getFullYear() === currentMonth.getFullYear() && 
          today.getMonth() === currentMonth.getMonth()) {
        console.log('Auto-selecting today:', todayKey);
        setSelectedDate(todayKey);
      }
    }
  }, [calendarData, selectedDate, today, currentMonth]);

  // Fetch data from SharePoint list
  React.useEffect(() => {
    const fetchData = async () => {
      if (!props.listId || !props.dateField) {
        setCalendarData({ dateCounts: new Map(), loading: false, error: null });
        return;
      }

      setCalendarData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Initialize PnP with SPFx context using the correct v3 pattern
        const sp: SPFI = spfi().using(SPFx(props.spfxContext));
        
        // Calculate date range for the current month
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        console.log('Fetching data for month range:', {
          startOfMonth: startOfMonth.toISOString(),
          endOfMonth: endOfMonth.toISOString()
        });
        
        const list = sp.web.lists.getById(props.listId);
        const items = await list.items
          .select(props.dateField)
          .top(5000)();

        const dateCounts = new Map<string, number>();

        items.forEach((item: any) => {
          const dateValue = item[props.dateField];
          if (dateValue) {
            // Parse the SharePoint date - it's in UTC format (e.g., "2025-10-19T22:00:00Z")
            // We need to extract the date part without timezone conversion
            const date = new Date(dateValue);
            
            console.log('=== DATE DEBUGGING ===');
            console.log('Original SharePoint date:', dateValue);
            console.log('Parsed Date object:', date);
            console.log('Date toString():', date.toString());
            console.log('Date toLocaleString():', date.toLocaleString());
            console.log('Date toUTCString():', date.toUTCString());
            
            // Extract date components from the original string to avoid timezone issues
            const dateMatch = dateValue.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (dateMatch) {
              const year = parseInt(dateMatch[1]);
              const month = parseInt(dateMatch[2]);
              const day = parseInt(dateMatch[3]);
              
              console.log('Extracted from string:', { year, month, day });
              
              const dateKey = `${year}-${padStart(String(month), 2)}-${padStart(String(day), 2)}`;
              console.log('Generated dateKey:', dateKey);
              console.log('========================');
              
              dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
            } else {
              // Fallback to local timezone parsing
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const day = date.getDate();
              
              console.log('Fallback local timezone values:', { year, month, day });
              
              const dateKey = `${year}-${padStart(String(month), 2)}-${padStart(String(day), 2)}`;
              console.log('Fallback dateKey:', dateKey);
              console.log('========================');
              
              dateCounts.set(dateKey, (dateCounts.get(dateKey) || 0) + 1);
            }
          }
        });

        console.log('Final dateCounts map:', Array.from(dateCounts.entries()));
        console.log('dateCounts size:', dateCounts.size);
        console.log('dateCounts for 2025-10-19:', dateCounts.get('2025-10-19'));
        setCalendarData({ dateCounts, loading: false, error: null });
      } catch (error) {
        setCalendarData({ 
          dateCounts: new Map(), 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    };

    fetchData();
  }, [props.listId, props.dateField, currentMonth]);

  const getDateKey = (day: number | null, year: number, monthIndex: number): string => {
    if (day === null) return '';
    return `${year}-${padStart(String(monthIndex + 1), 2)}-${padStart(String(day), 2)}`;
  };

  const getDateCount = (day: number | null): number => {
    if (day === null) return 0;
    const dateKey = getDateKey(day, model.year, model.monthIndex);
    const count = calendarData.dateCounts.get(dateKey) || 0;
    
    // Debug calendar date key generation - only for days 18-22 to match our test data
    if (day >= 18 && day <= 22) {
      console.log(`Calendar day ${day} -> dateKey: ${dateKey}, count: ${count}`);
      console.log(`Available keys in dateCounts:`, Array.from(calendarData.dateCounts.keys()));
    }
    
    return count;
  };

  const handleDateClick = (day: number | null) => {
    console.log('=== DATE CLICK DEBUGGING ===');
    console.log('Clicked day:', day);
    console.log('Day type:', typeof day);
    
    if (day === null) {
      console.log('Day is null, returning');
      return;
    }
    
    const count = getDateCount(day);
    console.log('Count for day', day, ':', count);
    
    // Always set the selected date, regardless of whether it has data or not
    const selectedDateStr = `${model.year}-${padStart(String(model.monthIndex + 1), 2)}-${padStart(String(day), 2)}`;
    console.log('Setting selected date to:', selectedDateStr);
    setSelectedDate(selectedDateStr);
    
    if (count > 0) {
      console.log('Selected date:', selectedDateStr, 'with', count, 'complaints');
    } else {
      console.log('Selected date:', selectedDateStr, 'with no complaints - will show no-data image');
    }
    console.log('========================');
  };

  return (
    <section className={styles.complaintsCalendar}>
      <div className={styles.grid}>
        <aside className={styles.left} style={{ backgroundColor: '#e9e6e6' }}>
          <header className={styles.calendarHeader}>
            <button 
              className={styles.navButton} 
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              title="Previous month"
            >
              ‹
            </button>
            <div className={styles.monthName}>{model.monthName} {model.year}</div>
            <button 
              className={styles.navButton} 
              onClick={goToNextMonth}
              aria-label="Next month"
              title="Next month"
            >
              ›
            </button>
          </header>
          <div role="grid" aria-label="Monthly calendar">
            <div className={styles.weekdays} role="row">
              {weekdayShort.map((d) => (
                <div key={d} className={styles.weekday} role="columnheader" aria-label={d}>{d}</div>
              ))}
            </div>
            <div className={styles.weeks}>
              {model.weeks.map((week, wi) => (
                <div key={wi} className={styles.week} role="row">
                  {week.map((day, di) => {
                    const isToday = day === today.getDate() && model.year === today.getFullYear() && model.monthIndex === today.getMonth();
                    const count = getDateCount(day);
                    const isClickable = day !== null; // All days are clickable now
                    return (
                      <div 
                        key={di} 
                        className={`${isToday ? styles.dayToday : styles.day} ${isClickable ? styles.dayClickable : ''}`} 
                        role="gridcell" 
                        aria-selected={isToday}
                        onClick={() => handleDateClick(day)}
                        style={{ cursor: isClickable ? 'pointer' : 'default' }}
                      >
                        <div className={styles['dayNumber']}>{day ?? ''}</div>
                        {count > 0 && (
                          <div className={styles['dayIndicator']} title={`${count} items`}>
                            {count}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>
        <main className={styles.right}>
          <h3 className={styles.listHeader}>
            {selectedDate ? (
              (() => {
                // Get the count for the selected date
                const count = calendarData.dateCounts.get(selectedDate) || 0;
                const formattedDate = formatDateToDisplay(selectedDate);
                return `Complaints for ${formattedDate} (${count} results)`;
              })()
            ) : 'Select a date with complaints'}
          </h3>
          <div className={styles.listContent}>
            {selectedDate ? (
              (() => {
                const count = calendarData.dateCounts.get(selectedDate) || 0;
                if (count > 0) {
                  return (
                    <>
                      {console.log('=== RENDERING GRID COMPLAINTS ===')}
                      {console.log('SelectedDate being passed:', selectedDate)}
                      {console.log('ListId:', props.listId)}
                      {console.log('DateField:', props.dateField)}
                      {console.log('TitleField:', props.titleField)}
                      <GridComplaints
                        selectedDate={selectedDate}
                        listId={props.listId}
                        dateField={props.dateField}
                        titleField={props.titleField}
                        spfxContext={props.spfxContext}
                      />
                    </>
                  );
                } else {
                  return (
                    <div className={styles.noDataContainer}>
                      <img 
                        src={require('../assets/no-data-2.jpg')} 
                        alt="No data available" 
                        className={styles.noDataImage}
                      />
                      <p className={styles.noDataText}>No complaints found for this date</p>
                    </div>
                  );
                }
              })()
            ) : (
              <div className={styles.listPlaceholder}>
                {calendarData.loading ? (
                  'Loading calendar data...'
                ) : calendarData.error ? (
                  `Error: ${calendarData.error}`
                ) : props.listId && props.dateField ? (
                  `Click on a date with complaints to view them. Found ${calendarData.dateCounts.size} dates with data.`
                ) : (
                  'Please configure list, date field, and title field in web part properties'
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}

export default ComplaintsCalendar;
