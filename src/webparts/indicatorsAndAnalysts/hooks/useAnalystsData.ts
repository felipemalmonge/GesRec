import { useState, useEffect, useMemo, useCallback } from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import { AnalystData, AnalystsData, UseAnalystsDataProps } from '../types/analysts';

/**
 * Custom hook for managing analysts data and calculations
 */
export const useAnalystsData = ({ listId, analystsListId, spfxContext }: UseAnalystsDataProps): AnalystsData => {
  console.log('useAnalystsData hook initialized with:', { listId, analystsListId, spfxContext: !!spfxContext });
  
  const [analysts, setAnalysts] = useState<AnalystData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Default analysts configuration (used when no list is selected or as fallback)
  const defaultAnalysts: AnalystData[] = useMemo(() => [
    {
      id: '1',
      name: 'John Doe',
      role: 'Customer Service',
      avatarUrl: 'https://via.placeholder.com/60x60/0078d4/ffffff?text=JD',
      initials: 'JD'
    },
    {
      id: '2',
      name: 'Jane Smith',
      role: 'Technical Support',
      avatarUrl: 'https://via.placeholder.com/60x60/28a745/ffffff?text=JS',
      initials: 'JS'
    },
    {
      id: '3',
      name: 'Mike Brown',
      role: 'Quality Assurance',
      avatarUrl: 'https://via.placeholder.com/60x60/ffc107/ffffff?text=MB',
      initials: 'MB'
    }
  ], []);

  // Fetch analysts data from SharePoint (if analystsListId provided)
  const fetchAnalystsData = useCallback(async (): Promise<void> => {
    console.log('fetchAnalystsData called with:', { listId, analystsListId });
    
    if (!analystsListId) {
      // Use default data if no analysts list configured
      console.log('No analystsListId provided, using default analysts');
      setAnalysts(defaultAnalysts);
      return;
    }

    if (!spfxContext || !spfxContext.pageContext || !spfxContext.pageContext.web) {
      console.warn('SPFx context not properly initialized');
      console.log('SPFx context details:', {
        hasContext: !!spfxContext,
        hasPageContext: !!spfxContext?.pageContext,
        hasWeb: !!spfxContext?.pageContext?.web
      });
      setAnalysts(defaultAnalysts);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching analysts data from SharePoint list:', analystsListId);
      
      // Use SPHttpClient for data fetching
      const webUrl = spfxContext.pageContext.web.absoluteUrl;
      
      // Use fixed column names: Title, Department, urlImage
      const listUrl = `${webUrl}/_api/web/lists('${analystsListId}')/items?$select=Id,Title,Department,urlImage`;
      
      console.log('Fetching analysts from URL:', listUrl);
      
      const response = await spfxContext.spHttpClient.get(listUrl, SPHttpClient.configurations.v1);
      const data = await response.json();
      const items = data.value || [];

      console.log('Fetched analysts items:', items);

      // Process SharePoint data into analysts using fixed column names
      const processedAnalysts: AnalystData[] = items.map((item: any) => {
        const analystName = item.Title || 'Unknown Analyst';
        const initials = analystName ? 
          analystName.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 
          'AN';
        
        return {
          id: item.Id.toString(),
          name: analystName,
          role: item.Department || 'Analyst',
          avatarUrl: item.urlImage,
          initials: initials
        };
      });

      console.log('Processed analysts:', processedAnalysts);
      setAnalysts(processedAnalysts);
    } catch (err) {
      console.error('Error fetching analysts data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analysts data');
      // Fallback to default data on error
      setAnalysts(defaultAnalysts);
    } finally {
      setLoading(false);
    }
  }, [analystsListId, spfxContext, defaultAnalysts]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    console.log('useEffect triggered, calling fetchAnalystsData');
    fetchAnalystsData();
  }, [fetchAnalystsData]);

  return {
    analysts,
    loading,
    error
  };
};
