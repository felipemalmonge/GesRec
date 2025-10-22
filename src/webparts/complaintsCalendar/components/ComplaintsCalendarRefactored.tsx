import * as React from 'react';
import styles from './ComplaintsCalendar.module.scss';
import { CalendarErrorBoundary } from './ErrorBoundary/CalendarErrorBoundary';
import { CalendarLoadingSpinner } from './LoadingSpinner/CalendarLoadingSpinner';
import { useCalendarData } from '../hooks/useCalendarData';
// import { SharePointService } from '../services/SharePointService';
import { CalendarService } from '../services/CalendarService';
import GridComplaints from './GridComplaints';
import { 
  ValidationResult,
  ComponentState 
} from '../types';
import type { IComplaintsCalendarProps } from './IComplaintsCalendarProps';

/**
 * Refactored ComplaintsCalendar component with improved architecture patterns
 */
const ComplaintsCalendarRefactored: React.FC<IComplaintsCalendarProps> = (props) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date(2025, 9, 1));
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [componentState, setComponentState] = React.useState<ComponentState>({
    isLoading: false,
    error: null
  });

  const today = React.useMemo(() => new Date(), []);

  // Initialize SharePoint service (for future use)
  // const sharePointService = React.useMemo(() => {
  //   return new SharePointService(props.spfxContext);
  // }, [props.spfxContext]);

  // Validate configuration first
  const validation: ValidationResult = React.useMemo(() => {
    console.log('ComplaintsCalendarRefactored validation - listId:', props.listId, 'dateField:', props.dateField, 'titleField:', props.titleField);
    const result = CalendarService.validateCalendarConfig({
      listId: props.listId,
      dateField: props.dateField,
      titleField: props.titleField
    });
    console.log('Validation result:', result);
    return result;
  }, [props.listId, props.dateField, props.titleField]);

  // Show configuration error if validation fails
  if (!validation.isValid) {
    return (
      <div className={styles.complaintsCalendar}>
        <div className={styles.grid}>
          <div className={styles.right}>
            <div className={styles.noDataContainer}>
              <div className={styles.noDataText}>
                <h3>Configuration Error</h3>
                <p>Please configure the web part properties:</p>
                <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
                <p>Edit the web part and configure these properties in the property pane.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use custom hook for calendar data only when configuration is valid
  const calendarData = useCalendarData({
    listId: props.listId,
    dateField: props.dateField,
    spfxContext: props.spfxContext,
    currentMonth
  });

  // Generate calendar month
  const calendarMonth = React.useMemo(() => {
    return CalendarService.generateCalendarMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      calendarData.dateCounts,
      selectedDate,
      today
    );
  }, [currentMonth, calendarData.dateCounts, selectedDate, today]);

  // Auto-select today's date if it has data
  React.useEffect(() => {
    if (!selectedDate && !calendarData.loading && calendarData.dateCounts.size > 0) {
      const todayKey = CalendarService.getTodayKey();
      const todayCount = calendarData.dateCounts.get(todayKey);
      
      if (todayCount && todayCount > 0 && 
          today.getFullYear() === currentMonth.getFullYear() && 
          today.getMonth() === currentMonth.getMonth()) {
        setSelectedDate(todayKey);
      }
    }
  }, [calendarData, selectedDate, today, currentMonth]);

  // Handle configuration errors
  React.useEffect(() => {
    if (!validation.isValid) {
      setComponentState(prev => ({
        ...prev,
        error: validation.errors.join(', ')
      }));
    } else {
      setComponentState(prev => ({
        ...prev,
        error: null
      }));
    }
  }, [validation]);

  // Navigation functions
  const goToPreviousMonth = React.useCallback((): void => {
    const navigationInfo = CalendarService.getMonthNavigationInfo(currentMonth);
    if (navigationInfo.canGoPrevious) {
      setCurrentMonth(navigationInfo.previousMonth);
    }
  }, [currentMonth]);

  const goToNextMonth = React.useCallback((): void => {
    const navigationInfo = CalendarService.getMonthNavigationInfo(currentMonth);
    if (navigationInfo.canGoNext) {
      setCurrentMonth(navigationInfo.nextMonth);
    }
  }, [currentMonth]);

  // Handle date click
  const handleDateClick = React.useCallback((day: number | null): void => {
    if (day === null) return;
    const selectedDateStr = CalendarService.formatDateKey(
      calendarMonth.year,
      calendarMonth.monthIndex + 1,
      day
    );
    setSelectedDate(selectedDateStr);
  }, [calendarMonth]);

  // Get date count (for future use)
  // const getDateCount = React.useCallback((day: number): number => {
  //   const dateKey = CalendarService.formatDateKey(
  //     calendarMonth.year,
  //     calendarMonth.monthIndex + 1,
  //     day
  //   );
  //   return calendarData.dateCounts.get(dateKey) || 0;
  // }, [calendarMonth, calendarData.dateCounts]);

  // Show loading state
  if (calendarData.loading || componentState.isLoading) {
    return (
      <CalendarLoadingSpinner 
        message="Loading calendar data..." 
        type="calendar"
        size="large"
      />
    );
  }

  // Show error state
  if (componentState.error || calendarData.error) {
    return (
      <div className={styles.complaintsCalendar}>
        <div style={{ padding: '20px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', color: '#856404' }}>
          <h3>Configuration Error</h3>
          <p>{componentState.error || calendarData.error}</p>
          <p>Please check the web part properties and ensure all fields are configured correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <CalendarErrorBoundary>
      <div className={styles.complaintsCalendar}>
        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.calendarHeader}>
              <button 
                className={styles.navButton}
                onClick={goToPreviousMonth}
                disabled={!CalendarService.canNavigatePrevious(currentMonth)}
                aria-label="Previous month"
              >
                ‹
              </button>
              <h2 className={styles.monthName}>
                {calendarMonth.monthName} {calendarMonth.year}
              </h2>
              <button 
                className={styles.navButton}
                onClick={goToNextMonth}
                disabled={!CalendarService.canNavigateNext(currentMonth)}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className={styles.weekdays}>
              {CalendarService.getWeekdayNames().map(day => (
                <div key={day} className={styles.weekday}>
                  {day}
                </div>
              ))}
            </div>

            <div className={styles.weeks}>
              {calendarMonth.days.map((week, weekIndex) => (
                <div key={weekIndex} className={styles.week}>
                  {week.map((day, dayIndex) => (
                    <CalendarDay
                      key={dayIndex}
                      day={day}
                      onClick={handleDateClick}
                      isClickable={day.isClickable}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.listContent}>
              <h3 className={styles.listHeader}>
                {selectedDate ? (
                  (() => {
                    const count = calendarData.dateCounts.get(selectedDate) || 0;
                    const formattedDate = CalendarService.formatDateForDisplay(selectedDate);
                    return `Complaints for ${formattedDate} (${count} results)`;
                  })()
                ) : 'Select a date with complaints'}
              </h3>

              {selectedDate ? (
                (() => {
                  const count = calendarData.dateCounts.get(selectedDate) || 0;
                  if (count > 0) {
                    return (
                      <GridComplaints
                        selectedDate={selectedDate}
                        listId={props.listId}
                        dateField={props.dateField}
                        titleField={props.titleField}
                        spfxContext={props.spfxContext}
                      />
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
                  <p>Click on a date in the calendar to view complaints for that day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CalendarErrorBoundary>
  );
};

/**
 * Individual calendar day component
 */
interface ICalendarDayProps {
  day: import('../types').CalendarDay;
  onClick: (day: number | null) => void;
  isClickable: boolean;
}

const CalendarDay: React.FC<ICalendarDayProps> = ({ day, onClick, isClickable }) => {
  const handleClick = (): void => {
    if (isClickable && day.dayNumber !== null) {
      onClick(day.dayNumber);
    }
  };

  return (
    <div
      className={`${styles.day} ${
        day.isToday ? styles.dayToday : ''
      } ${
        day.isSelected ? styles.daySelected : ''
      } ${
        day.hasData ? styles.dayHasData : ''
      } ${
        isClickable ? styles.dayClickable : styles.dayDisabled
      }`}
      onClick={handleClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      aria-label={
        day.dayNumber 
          ? `Day ${day.dayNumber}${day.hasData ? `, ${day.count} complaints` : ''}`
          : undefined
      }
    >
      <span className={styles.dayNumber}>{day.dayNumber}</span>
      {day.hasData && (
        <div className={styles.dayIndicator}>
          {day.count}
        </div>
      )}
    </div>
  );
};

export default ComplaintsCalendarRefactored;
