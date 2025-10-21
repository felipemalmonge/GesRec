import { useState, useEffect, useMemo } from 'react';
import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface CalendarData {
  dateCounts: Map<string, number>;
  loading: boolean;
  error: string | null;
}

export interface UseCalendarDataProps {
  listId: string;
  dateField: string;
  spfxContext: WebPartContext;
  currentMonth: Date;
}

/**
 * Custom hook for managing calendar data and SharePoint operations
 */
export const useCalendarData = ({ listId, dateField, spfxContext, currentMonth }: UseCalendarDataProps): CalendarData => {
  const [dateCounts, setDateCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize PnP SP instance
  const sp: SPFI = useMemo(() => {
    return spfi().using(SPFx(spfxContext));
  }, [spfxContext]);

  // Helper function to pad numbers
  const padStart = (str: string, length: number): string => {
    return str.padStart(length, '0');
  };

  // Helper function to format date for SharePoint
  const formatDateForSharePoint = (date: Date): string => {
    const year = date.getFullYear();
    const month = padStart(String(date.getMonth() + 1), 2);
    const day = padStart(String(date.getDate()), 2);
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse SharePoint date
  const parseSharePointDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = padStart(String(date.getMonth() + 1), 2);
      const day = padStart(String(date.getDate()), 2);
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing SharePoint date:', error);
      return '';
    }
  };

  // Fetch calendar data
  const fetchCalendarData = async (): Promise<void> => {
    if (!listId || !dateField) {
      setError('List ID and Date Field are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const startDate = formatDateForSharePoint(startOfMonth);
      const endDate = formatDateForSharePoint(endOfMonth);

      const items: any[] = await (sp.web.lists.getById(listId).items as any)
        .select(`Id, ${dateField}`)
        .filter(`${dateField} ge datetime'${startDate}T00:00:00Z' and ${dateField} le datetime'${endDate}T23:59:59Z'`)
        .get();

      const counts = new Map<string, number>();
      
      items.forEach((item: any) => {
        if (item[dateField]) {
          const dateKey = parseSharePointDate(item[dateField]);
          if (dateKey) {
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
          }
        }
      });

      setDateCounts(counts);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchCalendarData();
  }, [listId, dateField, currentMonth]);

  return {
    dateCounts,
    loading,
    error
  };
};
