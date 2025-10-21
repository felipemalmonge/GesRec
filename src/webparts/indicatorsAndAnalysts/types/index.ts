import { WebPartContext } from '@microsoft/sp-webpart-base';

/**
 * Indicator data structure
 */
export interface IndicatorData {
  id: string;
  title: string;
  value: number;
  icon: string;
  color: string;
  description: string;
}

/**
 * Component state for loading and error handling
 */
export interface ComponentState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Validation result for configuration
 */
export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Indicators data state
 */
export interface IndicatorsData {
  indicators: IndicatorData[];
  loading: boolean;
  error: string | null;
}

/**
 * SharePoint list item structure
 */
export interface SharePointItem {
  Id: number;
  Title: string;
  Status?: string;
  DueDate?: string;
  ClarificationStatus?: string;
  [key: string]: any;
}

/**
 * SharePoint list information
 */
export interface SharePointListInfo {
  Id: string;
  Title: string;
  Fields: SharePointFieldInfo[];
}

/**
 * SharePoint field information
 */
export interface SharePointFieldInfo {
  InternalName: string;
  Title: string;
  TypeAsString: string;
}

/**
 * Service configuration for indicators
 */
export interface IndicatorsServiceConfig {
  listId?: string;
  spfxContext: WebPartContext;
}

/**
 * Indicator statistics
 */
export interface IndicatorStatistics {
  total: number;
  average: number;
  highest: IndicatorData | null;
  lowest: IndicatorData | null;
}

/**
 * Color thresholds for indicators
 */
export interface ColorThresholds {
  low: number;
  medium: number;
  high: number;
}

/**
 * Indicator display options
 */
export interface IndicatorDisplayOptions {
  showIcons: boolean;
  showDescriptions: boolean;
  showStatistics: boolean;
  colorScheme: 'default' | 'custom' | 'threshold';
}

/**
 * Web part properties interface
 */
export interface IIndicatorsAndAnalystsProps {
  description: string;
  listId?: string;
  titleField?: string;
  statusField?: string;
  dueDateField?: string;
  clarificationField?: string;
  spfxContext: WebPartContext;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Loading spinner props
 */
export interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Stat card props
 */
export interface StatCardProps {
  indicator: IndicatorData;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

/**
 * Indicators container props
 */
export interface IndicatorsContainerProps {
  indicators: IndicatorData[];
  loading: boolean;
  error: string | null;
  showStatistics?: boolean;
  className?: string;
}
