import * as React from 'react';
import styles from './IndicatorsErrorBoundary.module.scss';

interface IndicatorsErrorBoundaryProps {
  children: React.ReactNode;
}

interface IndicatorsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component specifically for the Indicators component
 * Provides graceful error handling and user-friendly error messages
 */
export class IndicatorsErrorBoundary extends React.Component<IndicatorsErrorBoundaryProps, IndicatorsErrorBoundaryState> {
  public state: IndicatorsErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): IndicatorsErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Uncaught error in Indicators:", error, errorInfo);
    
    // Here you could log the error to an external service
    // Example: logErrorToService(error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3 className={styles.errorTitle}>Indicators Error</h3>
          <p className={styles.errorMessage}>
            An unexpected error occurred while loading the indicators. Please try refreshing the page or contact support if the issue persists.
          </p>
          <div className={styles.errorActions}>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            <button 
              className={styles.detailsButton}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
          {this.state.error && (
            <details className={styles.errorDetails}>
              <summary>Technical Details</summary>
              <div className={styles.errorStack}>
                <strong>Error:</strong> {this.state.error.message}
                <br />
                <strong>Stack:</strong>
                <pre>{this.state.error.stack}</pre>
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
