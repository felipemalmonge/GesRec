import { spfi, SPFI } from '@pnp/sp';
import { SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface SharePointListInfo {
  Id: string;
  Title: string;
  Fields: SharePointFieldInfo[];
}

export interface SharePointFieldInfo {
  InternalName: string;
  Title: string;
  TypeAsString: string;
}

export interface SharePointItem {
  Id: number;
  [key: string]: any;
}

export interface SharePointServiceConfig {
  listId: string;
  dateField: string;
  titleField: string;
  spfxContext: WebPartContext;
}

/**
 * Service for managing SharePoint operations
 */
export class SharePointService {
  private sp: SPFI;

  constructor(spfxContext: WebPartContext) {
    this.sp = spfi().using(SPFx(spfxContext));
  }

  /**
   * Get all lists from the current web
   */
  public async getLists(): Promise<SharePointListInfo[]> {
    try {
      const lists: any[] = await (this.sp.web.lists as any)
        .select('Id', 'Title')
        .filter('Hidden eq false')
        .get();

      return lists.map((list: any) => ({
        Id: list.Id,
        Title: list.Title,
        Fields: [] // Will be populated when needed
      }));
    } catch (error) {
      console.error('Error fetching lists:', error);
      throw new Error('Failed to fetch SharePoint lists');
    }
  }

  /**
   * Get fields for a specific list
   */
  public async getListFields(listId: string): Promise<SharePointFieldInfo[]> {
    try {
      const fields: any[] = await (this.sp.web.lists.getById(listId).fields as any)
        .select('InternalName', 'Title', 'TypeAsString')
        .filter('Hidden eq false and ReadOnlyField eq false')
        .get();

      return fields.map((field: any) => ({
        InternalName: field.InternalName,
        Title: field.Title,
        TypeAsString: field.TypeAsString
      }));
    } catch (error) {
      console.error('Error fetching list fields:', error);
      throw new Error('Failed to fetch list fields');
    }
  }

  /**
   * Get date fields from a list
   */
  public async getDateFields(listId: string): Promise<SharePointFieldInfo[]> {
    try {
      const fields = await this.getListFields(listId);
      return fields.filter(field => 
        field.TypeAsString === 'DateTime' || 
        field.TypeAsString === 'Date'
      );
    } catch (error) {
      console.error('Error fetching date fields:', error);
      throw new Error('Failed to fetch date fields');
    }
  }

  /**
   * Get items for a specific date
   */
  public async getItemsForDate(config: SharePointServiceConfig, selectedDate: string): Promise<SharePointItem[]> {
    try {
      const { listId, dateField, titleField } = config;
      
      const items: any[] = await (this.sp.web.lists.getById(listId).items as any)
        .select(`Id, ${titleField}, ${dateField}`)
        .filter(`${dateField} ge datetime'${selectedDate}T00:00:00Z' and ${dateField} le datetime'${selectedDate}T23:59:59Z'`)
        .get();

      return items;
    } catch (error) {
      console.error('Error fetching items for date:', error);
      throw new Error('Failed to fetch items for selected date');
    }
  }

  /**
   * Get calendar data for a month
   */
  public async getCalendarData(config: SharePointServiceConfig, currentMonth: Date): Promise<Map<string, number>> {
    try {
      const { listId, dateField } = config;
      
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const startDate = this.formatDateForSharePoint(startOfMonth);
      const endDate = this.formatDateForSharePoint(endOfMonth);

      const items: any[] = await (this.sp.web.lists.getById(listId).items as any)
        .select(`Id, ${dateField}`)
        .filter(`${dateField} ge datetime'${startDate}T00:00:00Z' and ${dateField} le datetime'${endDate}T23:59:59Z'`)
        .get();

      const counts = new Map<string, number>();
      
      items.forEach((item: any) => {
        if (item[dateField]) {
          const dateKey = this.parseSharePointDate(item[dateField]);
          if (dateKey) {
            counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
          }
        }
      });

      return counts;
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      throw new Error('Failed to fetch calendar data');
    }
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: SharePointServiceConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.listId?.trim()) {
      errors.push('List ID is required');
    }

    if (!config.dateField?.trim()) {
      errors.push('Date Field is required');
    }

    if (!config.titleField?.trim()) {
      errors.push('Title Field is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper function to format date for SharePoint
   */
  private formatDateForSharePoint(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper function to parse SharePoint date
   */
  private parseSharePointDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing SharePoint date:', error);
      return '';
    }
  }
}
