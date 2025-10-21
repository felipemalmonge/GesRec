/**
 * Shared types for GesRec web part
 */

export interface WebPartConfig {
  description: string;
  complaintsAppUrl: string;
  servicingAppUrl: string;
  reportsUrl: string;
  searchUrl: string;
}

export interface ComponentState {
  isLoading: boolean;
  error: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type ThemeVariant = 'light' | 'dark';

export interface AccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
}
