
export interface Course {
  order: string;
  accent: string;
  title: string;
  lessonsTotal: number;
  progressPct: number;
  link: string;
}

export interface CourseServiceConfig {
  servicingAppUrl: string;
  reportsUrl: string;
  searchUrl: string;
}

/**
 * Service for managing course data and configuration
 */
export class CourseService {
  private static readonly DEFAULT_ACCENT_COLOR = '#C8E1F3';
  private static readonly FALLBACK_LINK = '#';

  /**
   * Get courses configuration based on web part properties
   */
  public static getCourses(config: CourseServiceConfig): Course[] {
    return [
      {
        order: '01',
        accent: this.DEFAULT_ACCENT_COLOR,
        title: 'Servicing App',
        lessonsTotal: 24,
        progressPct: 45,
        link: config.servicingAppUrl || this.FALLBACK_LINK
      },
      {
        order: '02',
        accent: this.DEFAULT_ACCENT_COLOR,
        title: 'Reports',
        lessonsTotal: 18,
        progressPct: 70,
        link: config.reportsUrl || this.FALLBACK_LINK
      },
      {
        order: '03',
        accent: this.DEFAULT_ACCENT_COLOR,
        title: 'Search',
        lessonsTotal: 12,
        progressPct: 20,
        link: config.searchUrl || this.FALLBACK_LINK
      }
    ];
  }

  /**
   * Get icon mapping for course titles
   */
  public static getIconMapping(): Record<string, string> {
    return {
      'Servicing App': 'ReminderGroup',
      'Reports': 'ReportDocument',
      'Search': 'SearchAndApps'
    };
  }

  /**
   * Validate course configuration
   */
  public static validateConfig(config: CourseServiceConfig): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.servicingAppUrl?.trim()) {
      errors.push('Servicing App URL is required');
    }

    if (!config.reportsUrl?.trim()) {
      errors.push('Reports URL is required');
    }

    if (!config.searchUrl?.trim()) {
      errors.push('Search URL is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
