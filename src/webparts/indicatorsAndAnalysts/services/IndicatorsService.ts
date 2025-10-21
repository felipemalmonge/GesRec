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

export interface SharePointItem {
  Id: number;
  [key: string]: any;
}

export interface IndicatorsServiceConfig {
  listId?: string;
  spfxContext: WebPartContext;
}

/**
 * Service for managing indicators data and calculations
 */
export class IndicatorsService {
  private sp: SPFI;

  constructor(spfxContext: WebPartContext) {
    this.sp = spfi().using(SPFx(spfxContext));
  }

  /**
   * Get default indicators configuration
   */
  public static getDefaultIndicators(): IndicatorData[] {
    return [
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
    ];
  }

  /**
   * Get indicators data from SharePoint list
   */
  public async getIndicatorsFromSharePoint(config: IndicatorsServiceConfig): Promise<IndicatorData[]> {
    if (!config.listId) {
      return IndicatorsService.getDefaultIndicators();
    }

    try {
      const items: any[] = await (this.sp.web.lists.getById(config.listId).items as any)
        .select('Id', 'Title', 'Status', 'DueDate', 'ClarificationStatus')
        .get();

      return this.processSharePointData(items);
    } catch (error) {
      console.error('Error fetching indicators from SharePoint:', error);
      // Return default data on error
      return IndicatorsService.getDefaultIndicators();
    }
  }

  /**
   * Process SharePoint data into indicators format
   */
  private processSharePointData(items: SharePointItem[]): IndicatorData[] {
    const today = new Date();
    const todayString = today.toDateString();

    return [
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
          return dueDate.toDateString() === todayString;
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
  }

  /**
   * Calculate indicator statistics
   */
  public calculateStatistics(indicators: IndicatorData[]): {
    total: number;
    average: number;
    highest: IndicatorData | null;
    lowest: IndicatorData | null;
  } {
    if (indicators.length === 0) {
      return {
        total: 0,
        average: 0,
        highest: null,
        lowest: null
      };
    }

    const total = indicators.reduce((sum, indicator) => sum + indicator.value, 0);
    const average = total / indicators.length;
    const highest = indicators.reduce((max, indicator) => 
      indicator.value > max.value ? indicator : max
    );
    const lowest = indicators.reduce((min, indicator) => 
      indicator.value < min.value ? indicator : min
    );

    return {
      total,
      average: Math.round(average * 100) / 100,
      highest,
      lowest
    };
  }

  /**
   * Get indicator by ID
   */
  public getIndicatorById(indicators: IndicatorData[], id: string): IndicatorData | null {
    return indicators.find(indicator => indicator.id === id) || null;
  }

  /**
   * Validate indicators configuration
   */
  public validateConfig(config: IndicatorsServiceConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // List ID is optional, so no validation needed
    // Add other validations as needed

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get indicator color based on value thresholds
   */
  public getIndicatorColor(value: number, thresholds: {
    low: number;
    medium: number;
    high: number;
  }): string {
    if (value <= thresholds.low) {
      return '#28a745'; // Green
    } else if (value <= thresholds.medium) {
      return '#ffc107'; // Yellow
    } else {
      return '#dc3545'; // Red
    }
  }

  /**
   * Format indicator value for display
   */
  public formatValue(value: number, type: 'number' | 'percentage' | 'currency' = 'number'): string {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  }
}
