import * as React from 'react';
import styles from './CalendarErrorBoundary.module.scss';

export interface ICalendarErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface ICalendarErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

/**
 * Error boundary component specifically for calendar components
 */
export class CalendarErrorBoundary extends React.Component<ICalendarErrorBoundaryProps, ICalendarErrorBoundaryState> {
  constructor(props: ICalendarErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ICalendarErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('CalendarErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private resetError = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className={styles.calendarErrorBoundary}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>📅</div>
            <h2 className={styles.errorTitle}>Calendar Error</h2>
            <p className={styles.errorMessage}>
              There was an error loading the calendar. This might be due to configuration issues or SharePoint connectivity problems.
            </p>
            <div className={styles.errorActions}>
              <button 
                className={styles.retryButton} 
                onClick={this.resetError}
                type="button"
              >
                Try Again
              </button>
              <button 
                className={styles.configButton} 
                onClick={() => window.location.reload()}
                type="button"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
