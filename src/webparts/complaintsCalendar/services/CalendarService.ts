import { CalendarDay, CalendarMonth, ValidationResult } from '../types';

/**
 * Service for calendar-related operations and utilities
 */
export class CalendarService {
  private static readonly MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  private static readonly WEEKDAY_NAMES = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  /**
   * Generate calendar month data
   */
  public static generateCalendarMonth(
    year: number, 
    monthIndex: number, 
    dateCounts: Map<string, number>,
    selectedDate: string | null,
    today: Date
  ): CalendarMonth {
    const firstDay = new Date(year, monthIndex, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dayNumber = currentDate.getMonth() === monthIndex ? currentDate.getDate() : null;
      const dateKey = dayNumber ? this.formatDateKey(year, monthIndex + 1, dayNumber) : '';
      
      const isToday = this.isSameDate(currentDate, today);
      const isSelected = selectedDate === dateKey;
      const hasData = dateKey ? (dateCounts.get(dateKey) || 0) > 0 : false;
      const count = dateKey ? (dateCounts.get(dateKey) || 0) : 0;
      const isClickable = dayNumber !== null;

      const day: CalendarDay = {
        dayNumber,
        isToday,
        isSelected,
        hasData,
        count,
        isClickable
      };

      currentWeek.push(day);

      if (currentWeek.length === 7) {
        days.push(currentWeek);
        currentWeek = [];
      }
    }

    return {
      year,
      monthIndex,
      monthName: this.MONTH_NAMES[monthIndex],
      days
    };
  }

  /**
   * Get weekday names
   */
  public static getWeekdayNames(): string[] {
    return [...this.WEEKDAY_NAMES];
  }

  /**
   * Format date key for consistent date handling
   */
  public static formatDateKey(year: number, month: number, day: number): string {
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  }

  /**
   * Format date for display (dd/mm/yyyy)
   */
  public static formatDateForDisplay(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Check if two dates are the same day
   */
  public static isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Get today's date key
   */
  public static getTodayKey(): string {
    const today = new Date();
    return this.formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }

  /**
   * Navigate to previous month
   */
  public static getPreviousMonth(currentMonth: Date): Date {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    return newDate;
  }

  /**
   * Navigate to next month
   */
  public static getNextMonth(currentMonth: Date): Date {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    return newDate;
  }

  /**
   * Check if navigation is allowed
   */
  public static canNavigatePrevious(currentMonth: Date): boolean {
    const minDate = new Date(2020, 0, 1); // Minimum date for navigation
    return currentMonth > minDate;
  }

  /**
   * Check if navigation is allowed
   */
  public static canNavigateNext(currentMonth: Date): boolean {
    const maxDate = new Date(2030, 11, 31); // Maximum date for navigation
    return currentMonth < maxDate;
  }

  /**
   * Validate calendar configuration
   */
  public static validateCalendarConfig(config: {
    listId: string;
    dateField: string;
    titleField: string;
  }): ValidationResult {
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
   * Get month navigation info
   */
  public static getMonthNavigationInfo(currentMonth: Date): {
    canGoPrevious: boolean;
    canGoNext: boolean;
    previousMonth: Date;
    nextMonth: Date;
  } {
    return {
      canGoPrevious: this.canNavigatePrevious(currentMonth),
      canGoNext: this.canNavigateNext(currentMonth),
      previousMonth: this.getPreviousMonth(currentMonth),
      nextMonth: this.getNextMonth(currentMonth)
    };
  }
}
