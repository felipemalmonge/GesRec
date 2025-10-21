/**
 * Shared types for ComplaintsCalendar web part
 */

export interface CalendarConfig {
  listId: string;
  dateField: string;
  titleField: string;
}

export interface CalendarState {
  isLoading: boolean;
  error: string | null;
  selectedDate: string | null;
}

export interface CalendarData {
  dateCounts: Map<string, number>;
  loading: boolean;
  error: string | null;
}

export interface CalendarDay {
  dayNumber: number | null;
  isToday: boolean;
  isSelected: boolean;
  hasData: boolean;
  count: number;
  isClickable: boolean;
}

export interface CalendarMonth {
  year: number;
  monthIndex: number;
  monthName: string;
  days: CalendarDay[][];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

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

export interface AccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
}

export interface ComponentState {
  isLoading: boolean;
  error: string | null;
}

export type ThemeVariant = 'light' | 'dark';

export interface CalendarNavigationProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
}

export interface CalendarDayProps {
  day: CalendarDay;
  onClick: (day: number | null) => void;
  isClickable: boolean;
}

export interface GridComplaintsProps {
  selectedDate: string;
  listId: string;
  dateField: string;
  titleField: string;
  spfxContext: any;
}
