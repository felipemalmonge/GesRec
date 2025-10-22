import * as React from 'react';
import styles from './IndicatorsRefactored.module.scss';
import { IndicatorsErrorBoundary } from './ErrorBoundary/IndicatorsErrorBoundary';
import { IndicatorsLoadingSpinner } from './LoadingSpinner/IndicatorsLoadingSpinner';
import { StatCard } from './StatCard/StatCard';
import { useIndicatorsData } from '../hooks/useIndicatorsData';
import { 
  ComponentState,
  ValidationResult,
  IndicatorData
} from '../types';
import type { IIndicatorsAndAnalystsProps } from './IIndicatorsAndAnalystsProps';

/**
 * Refactored Indicators component with improved architecture patterns
 * Implements best practices: custom hooks, service layer, error boundaries, loading states
 */
const IndicatorsRefactored: React.FC<IIndicatorsAndAnalystsProps> = (props) => {
  const [componentState, setComponentState] = React.useState<ComponentState>({
    isLoading: false,
    error: null
  });

  // Use custom hook for indicators data
  const indicatorsData = useIndicatorsData({
    listId: props.listId,
    spfxContext: props.spfxContext
  });

  // Initial validation of web part properties
  React.useEffect(() => {
    const validateProps = (): ValidationResult => {
      // List ID is optional, so no validation needed
      // Add other validations as needed
      return { isValid: true, message: '' };
    };

    const validation = validateProps();
    if (!validation.isValid) {
      setComponentState({ isLoading: false, error: validation.message });
    } else {
      setComponentState({ isLoading: false, error: null });
    }
  }, [props.listId]);

  // Show loading state
  if (indicatorsData.loading || componentState.isLoading) {
    return (
      <IndicatorsLoadingSpinner 
        message={indicatorsData.loading ? "Fetching indicators data..." : "Initializing indicators..."}
        size="large"
      />
    );
  }

  // Show error state
  if (componentState.error || indicatorsData.error) {
    return (
      <div className={styles.indicatorsContainer}>
        <div className={styles.errorContainer}>
          <h3>Configuration Error</h3>
          <p>{componentState.error || indicatorsData.error}</p>
          <p>Please check the web part properties and ensure all fields are configured correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <IndicatorsErrorBoundary>
      <div className={styles.indicatorsContainer}>
        <div className={styles.indicatorsHeader}>
          <h2 className={styles.indicatorsTitle}>Indicators</h2>
        </div>

        <div className={styles.indicatorsGrid}>
          {indicatorsData.indicators.map((indicator: IndicatorData) => (
            <StatCard
              key={indicator.id}
              indicator={indicator}
              showIcon={true}
              showDescription={true}
              className={styles.statCard}
            />
          ))}
        </div>

      </div>
    </IndicatorsErrorBoundary>
  );
};

export default IndicatorsRefactored;
