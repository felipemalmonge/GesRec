import { useState, useEffect, useMemo } from 'react';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';

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
  spfxContext: WebPartContext;
}

/**
 * Custom hook for managing indicators data and calculations
 */
export const useIndicatorsData = ({ listId, spfxContext }: UseIndicatorsDataProps): IndicatorsData => {
  const [indicators, setIndicators] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize PnP SP instance
  const sp: SPFI = useMemo(() => {
    return spfi().using(SPFx(spfxContext));
  }, [spfxContext]);

  // Default indicators configuration
  const defaultIndicators: IndicatorData[] = useMemo(() => [
    {
      id: 'complaints',
      title: 'Total complaints (Status not closed)',
      value: 2,
      icon: 'bad-review.png',
      color: '#dc3545',
      description: 'Active complaints requiring attention'
    },
    {
      id: 'answer-limit',
      title: 'Answer Limit Date Today',
      value: 3,
      icon: 'calendar.png',
      color: '#ffc107',
      description: 'Complaints with deadlines today'
    },
    {
      id: 'clarifications',
      title: 'Clarifications Pending',
      value: 8,
      icon: 'file.png',
      color: '#17a2b8',
      description: 'Pending clarification requests'
    }
  ], []);

  // Fetch indicators data from SharePoint (if listId provided)
  const fetchIndicatorsData = async (): Promise<void> => {
    if (!listId) {
      // Use default data if no list configured
      setIndicators(defaultIndicators);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Example: Fetch data from SharePoint list
      // This would be customized based on your specific SharePoint list structure
      const items: any[] = await (sp.web.lists.getById(listId).items as any)
        .select('Id', 'Title', 'Status', 'DueDate', 'ClarificationStatus')
        .get();

      // Process SharePoint data into indicators
      const processedIndicators: IndicatorData[] = [
        {
          id: 'complaints',
          title: 'Total complaints (Status not closed)',
          value: items.filter(item => item.Status !== 'Closed').length,
          icon: 'bad-review.png',
          color: '#dc3545',
          description: 'Active complaints requiring attention'
        },
        {
          id: 'answer-limit',
          title: 'Answer Limit Date Today',
          value: items.filter(item => {
            if (!item.DueDate) return false;
            const dueDate = new Date(item.DueDate);
            const today = new Date();
            return dueDate.toDateString() === today.toDateString();
          }).length,
          icon: 'calendar.png',
          color: '#ffc107',
          description: 'Complaints with deadlines today'
        },
        {
          id: 'clarifications',
          title: 'Clarifications Pending',
          value: items.filter(item => item.ClarificationStatus === 'Pending').length,
          icon: 'file.png',
          color: '#17a2b8',
          description: 'Pending clarification requests'
        }
      ];

      setIndicators(processedIndicators);
    } catch (err) {
      console.error('Error fetching indicators data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch indicators data');
      // Fallback to default data on error
      setIndicators(defaultIndicators);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchIndicatorsData();
  }, [listId, spfxContext]);

  return {
    indicators,
    loading,
    error
  };
};
