import { useState, useEffect, useMemo, useCallback } from 'react';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';

export interface IndicatorData {
  id: string;
  title: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}

export interface IndicatorsData {
  indicators: IndicatorData[];
  loading: boolean;
  error: string | null;
}

export interface UseIndicatorsDataProps {
  listId?: string;
  statusColumn?: string;
  dateTestColumn?: string;
  spfxContext: WebPartContext;
}

/**
 * Custom hook for managing indicators data and calculations
 */
export const useIndicatorsData = ({ listId, statusColumn, dateTestColumn, spfxContext }: UseIndicatorsDataProps): IndicatorsData => {
  console.log('useIndicatorsData hook initialized with:', { listId, spfxContext: !!spfxContext });
  console.log('About to create SP instance...');
  
  const [indicators, setIndicators] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize PnP SP instance
  const sp: SPFI | null = useMemo(() => {
    console.log('Creating SP instance with context:', !!spfxContext);
    console.log('SPFx context details:', {
      hasContext: !!spfxContext,
      hasPageContext: !!spfxContext?.pageContext,
      hasWeb: !!spfxContext?.pageContext?.web,
      webUrl: spfxContext?.pageContext?.web?.absoluteUrl
    });
    
    if (!spfxContext) {
      console.error('spfxContext is null or undefined');
      return null;
    }
    
    try {
      console.log('Attempting to create SP instance...');
      const spInstance = spfi().using(SPFx(spfxContext));
      console.log('SP instance created successfully:', !!spInstance);
      console.log('SP instance web property:', !!spInstance?.web);
      return spInstance;
    } catch (error) {
      console.error('Error creating SP instance:', error);
      return null;
    }
  }, [spfxContext]);

  console.log('SP instance after creation:', {
    spExists: !!sp,
    spWebExists: !!(sp && sp.web),
    spType: typeof sp
  });

  // Function to create indicators with dynamic values
  const createIndicators = useCallback((complaintsCount: number = 0, answerLimitCount: number = 0, clarificationsCount: number = 0): IndicatorData[] => {
    console.log('createIndicators called with:', { complaintsCount, answerLimitCount, clarificationsCount });
    return [
    {
      id: 'complaints',
      title: 'Total complaints (Status not closed)',
      value: complaintsCount,
      icon: 'bad-review.png',
      color: '#dc3545',
      description: 'Active complaints requiring attention'
    },
    {
      id: 'answer-limit',
      title: 'Answer Limit Date Today',
      value: answerLimitCount,
      icon: 'calendar.png',
      color: '#ffc107',
      description: 'Complaints with deadlines today'
    },
    {
      id: 'clarifications',
      title: 'Clarifications Pending',
      value: clarificationsCount,
      icon: 'file.png',
      color: '#17a2b8',
      description: 'Pending clarification requests'
    }
  ];
  }, []);

  // Default indicators configuration (used when no list is selected or as fallback)
  const defaultIndicators: IndicatorData[] = useMemo(() => createIndicators(2, 3, 8), [createIndicators]);

  // Fetch indicators data from SharePoint (if listId provided)
  const fetchIndicatorsData = useCallback(async (): Promise<void> => {
    console.log('fetchIndicatorsData called with:', { listId, statusColumn, dateTestColumn });
    
    if (!listId) {
      // Use default data if no list configured
      console.log('No listId provided, using default indicators');
      setIndicators(defaultIndicators);
      return;
    }

    if (!spfxContext || !spfxContext.pageContext || !spfxContext.pageContext.web) {
      console.warn('SPFx context not properly initialized');
      console.log('SPFx context details:', {
        hasContext: !!spfxContext,
        hasPageContext: !!spfxContext?.pageContext,
        hasWeb: !!spfxContext?.pageContext?.web
      });
      setIndicators(defaultIndicators);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching data from SharePoint list:', listId);
      
      // Use SPHttpClient instead of PnP SP for more reliable data fetching
      const webUrl = spfxContext.pageContext.web.absoluteUrl;
      
      // Build dynamic select fields
      const selectFields = ['Id', 'Title'];
      if (statusColumn) selectFields.push(statusColumn);
      if (dateTestColumn) selectFields.push(dateTestColumn);

      // Helper to fetch all items with paging
      const fetchAllItems = async (): Promise<any[]> => {
        let items: any[] = [];
        let nextUrl = `${webUrl}/_api/web/lists('${listId}')/items?$select=${selectFields.join(',')}&$top=100`;
        while (nextUrl) {
          const response = await spfxContext.spHttpClient.get(nextUrl, SPHttpClient.configurations.v1);
          const data = await response.json();
          items = items.concat(data.value || []);
          nextUrl = data['@odata.nextLink'] || null;
        }
        return items;
      };

      const items = await fetchAllItems();
      console.log('Fetched items:', items);

      // Calculate counts based on specific criteria using dynamic column names
      const statusField = statusColumn || 'STATUS_';
      const dateField = dateTestColumn || 'DateTest';
      
      const complaintsCount = items.filter((item: any) => item[statusField] !== 'CLOSED').length;
      
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();
      const answerLimitCount = items.filter((item: any) => {
        if (!item[dateField]) return false;
        const itemDate = new Date(item[dateField]);
        return (
          itemDate.getFullYear() === todayYear &&
          itemDate.getMonth() === todayMonth &&
          itemDate.getDate() === todayDate
        );
      }).length;
      
      const clarificationsCount = items.filter((item: any) => item[statusField] === 'PENDING').length;

      console.log('Calculated counts:', { complaintsCount, answerLimitCount, clarificationsCount });

      // Process SharePoint data into indicators with real counts
      const processedIndicators: IndicatorData[] = createIndicators(complaintsCount, answerLimitCount, clarificationsCount);

      setIndicators(processedIndicators);
    } catch (err) {
      console.error('Error fetching indicators data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch indicators data');
      // Fallback to default data on error
      setIndicators(defaultIndicators);
    } finally {
      setLoading(false);
    }
  }, [listId, statusColumn, dateTestColumn, spfxContext, createIndicators]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    console.log('useEffect triggered, calling fetchIndicatorsData');
    fetchIndicatorsData();
  }, [fetchIndicatorsData]);

  return {
    indicators,
    loading,
    error
  };
};
