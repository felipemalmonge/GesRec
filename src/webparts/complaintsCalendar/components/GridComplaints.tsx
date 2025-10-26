import * as React from 'react';
import styles from './GridComplaints.module.scss';
import type { IGridComplaintsProps } from './IGridComplaintsProps';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';


interface ComplaintItem {
  Id: number;
  Title: string;
  [key: string]: any; // For other fields
}

interface GridComplaintsData {
  items: ComplaintItem[];
  loading: boolean;
  error: string | null;
}

const GridComplaints: React.FC<IGridComplaintsProps> = (props) => {
  const [gridData, setGridData] = React.useState<GridComplaintsData>({
    items: [],
    loading: false,
    error: null
  });

  // Fetch complaints for the selected date
  React.useEffect(() => {
    const fetchComplaints = async () => {
      if (!props.selectedDate || !props.listId || !props.dateField || !props.titleField) {
        setGridData({ items: [], loading: false, error: null });
        return;
      }

      setGridData(prev => ({ ...prev, loading: true, error: null }));

      console.log('=== GRID COMPLAINTS DEBUGGING ===');
      console.log('Selected date received:', props.selectedDate);
      console.log('Selected date type:', typeof props.selectedDate);
      console.log('Exact comparison with 2025-10-18:', props.selectedDate === '2025-10-18');
      console.log('Includes 2025-10-18:', props.selectedDate?.includes('2025-10-18'));
      
      // Check if it's the test date 2025-10-18 (flexible matching)
      if (props.selectedDate === '2025-10-18' || props.selectedDate?.includes('2025-10-18')) {
        console.log('=== USING FAKE DATA FOR TESTING ===');
        console.log('Selected date:', props.selectedDate);
        
        // Create fake complaint data
        const fakeComplaints: ComplaintItem[] = [
          {
            Id: 1,
            Title: 'Customer Service Issue - Product Defect',
            [props.dateField]: '2025-10-18T10:30:00Z',
            [props.titleField]: 'Customer Service Issue - Product Defect'
          },
          {
            Id: 2,
            Title: 'Billing Dispute - Overcharge',
            [props.dateField]: '2025-10-18T14:15:00Z',
            [props.titleField]: 'Billing Dispute - Overcharge'
          },
          {
            Id: 3,
            Title: 'Delivery Problem - Late Shipment',
            [props.dateField]: '2025-10-18T16:45:00Z',
            [props.titleField]: 'Delivery Problem - Late Shipment'
          },
          {
            Id: 4,
            Title: 'Quality Control - Damaged Goods',
            [props.dateField]: '2025-10-18T09:20:00Z',
            [props.titleField]: 'Quality Control - Damaged Goods'
          },
          {
            Id: 5,
            Title: 'Refund Request - Unsatisfied Customer',
            [props.dateField]: '2025-10-18T11:30:00Z',
            [props.titleField]: 'Refund Request - Unsatisfied Customer'
          },
          {
            Id: 6,
            Title: 'Technical Support - System Error',
            [props.dateField]: '2025-10-18T13:10:00Z',
            [props.titleField]: 'Technical Support - System Error'
          },
          {
            Id: 7,
            Title: 'Account Management - Access Issue',
            [props.dateField]: '2025-10-18T15:25:00Z',
            [props.titleField]: 'Account Management - Access Issue'
          },
          {
            Id: 8,
            Title: 'Warranty Claim - Equipment Failure',
            [props.dateField]: '2025-10-18T08:45:00Z',
            [props.titleField]: 'Warranty Claim - Equipment Failure'
          },
          {
            Id: 9,
            Title: 'Complaint Resolution - Follow-up Required',
            [props.dateField]: '2025-10-18T17:30:00Z',
            [props.titleField]: 'Complaint Resolution - Follow-up Required'
          }
        ];

        console.log('Fake complaints created:', fakeComplaints.length);
        console.log('========================');

        setGridData({ 
          items: fakeComplaints, 
          loading: false, 
          error: null 
        });
        return;
      }

      try {
        // Check if required properties are configured
        if (!props.listId || !props.dateField || !props.titleField || 
            props.listId.trim() === '' || props.dateField.trim() === '' || props.titleField.trim() === '') {
          console.log('Configuration missing - skipping SharePoint API call');
          setGridData({ items: [], loading: false, error: null });
          return;
        }

        // Initialize PnP with SPFx context
        const sp: SPFI = spfi().using(SPFx(props.spfxContext));
        
        // Parse the selected date to create a date range for the day
        const selectedDate = new Date(props.selectedDate);
        const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
        
        console.log('=== GRID COMPLAINTS DEBUGGING ===');
        console.log('Selected date string:', props.selectedDate);
        console.log('Parsed selected date:', selectedDate);
        console.log('Start of day:', startOfDay.toISOString());
        console.log('End of day:', endOfDay.toISOString());
        console.log('List ID:', props.listId);
        console.log('Date field:', props.dateField);
        console.log('Title field:', props.titleField);

        // Query SharePoint list for items with the selected date
        const list = sp.web.lists.getById(props.listId);
        const filterQuery = `${props.dateField} ge datetime'${startOfDay.toISOString()}' and ${props.dateField} lt datetime'${endOfDay.toISOString()}'`;
        
        console.log('SharePoint filter query:', filterQuery);
        
        const items = await list.items
          .filter(filterQuery)
          .select('Id', props.titleField, props.dateField)
          .top(5000)();

        console.log('Fetched complaints count:', items.length);
        console.log('Fetched complaints:', items);
        console.log('========================');

        setGridData({ 
          items: items as ComplaintItem[], 
          loading: false, 
          error: null 
        });
      } catch (error) {
        console.error('Error fetching complaints:', error);
        setGridData({ 
          items: [], 
          loading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    };

    fetchComplaints();
  }, [props.selectedDate, props.listId, props.dateField, props.titleField, props.spfxContext]);

  // Show loading state
  if (gridData.loading) {
    return (
      <div className={styles.gridComplaints}>
        <div className={styles.loading}>
          <p>Loading complaints...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (gridData.error) {
    return (
      <div className={styles.gridComplaints}>
        <div className={styles.error}>
          <h3>Error loading complaints</h3>
          <p>{gridData.error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (gridData.items.length === 0) {
    return (
      <div className={styles.gridComplaints}>
        <div className={styles.emptyState}>
          <h3>No complaints found</h3>
          <p>No complaints found for the selected date.</p>
        </div>
      </div>
    );
  }

  // Show complaints list
  return (
    <div className={styles.gridComplaints}>
      <div className={styles.wrapper}>
        <div className={styles.list}>
          {gridData.items.map((item, index) => (
            <article key={item.Id} className={styles.card}>
              <div className={`${styles.thumb} ${index % 2 === 0 ? '' : styles['thumb--indigo']}`}>
                {/* Placeholder for complaint icon/thumbnail */}
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: index % 2 === 0 ? '#003146' : '#003146',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  📋
                </div>
              </div>

              <div className={styles.content}>
                <h3 className={styles.title}>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    {item[props.titleField] || 'Untitled Complaint'}
                  </a>
                </h3>
                <p className={styles.desc}>
                  Complaint ID: {item.Id}
                </p>
                <div className={styles.meta}>
                  {item[props.dateField] ? 
                    new Date(item[props.dateField]).toLocaleDateString('pt-PT') : 
                    'No date'
                  }
                </div>
              </div>

              {/* <div className={styles.right}>
                <div className={styles.privacy}>
                  <span>Active</span>
                  <label className={styles.toggle} aria-label="Active">
                    <input type="checkbox" defaultChecked />
                    <span className={styles.track}></span>
                    <span className={styles.thumb} aria-hidden="true"></span>
                  </label>
                </div>
                <div className={styles.actions} aria-label="Actions">
                  <button className={styles.iconbtn} title="Edit" aria-label="Edit">
                    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm15.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.29 1.29 3.75 3.75 1.46-1.12z"/>
                    </svg>
                  </button>
                  <button className={styles.iconbtn} title="Delete" aria-label="Delete">
                    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 7h12v2H6V7zm2 3h8l-1 9H9L8 10zm3-6h2l1 1h4v2H6V5h4l1-1z"/>
                    </svg>
                  </button>
                </div>
              </div> */}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridComplaints;
