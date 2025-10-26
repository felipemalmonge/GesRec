import * as React from 'react';
import styles from './IndicatorsAndAnalystsRefactored.module.scss';
import { IndicatorsErrorBoundary } from './ErrorBoundary/IndicatorsErrorBoundary';
import { IndicatorsLoadingSpinner } from './LoadingSpinner/IndicatorsLoadingSpinner';
import IndicatorsRefactored from './IndicatorsRefactored';
import AnalystsRefactored from './AnalystsRefactored';
import { 
  ComponentState,
  ValidationResult
} from '../types';
import type { IIndicatorsAndAnalystsProps } from './IIndicatorsAndAnalystsProps';

/**
 * Refactored IndicatorsAndAnalysts component with improved architecture patterns
 * Implements best practices: custom hooks, service layer, error boundaries, loading states
 */
const IndicatorsAndAnalystsRefactored: React.FC<IIndicatorsAndAnalystsProps> = (props) => {
  const [componentState, setComponentState] = React.useState<ComponentState>({
    isLoading: false,
    error: null
  });

  // Initial validation of web part properties
  React.useEffect(() => {
    const validateProps = (): ValidationResult => {
      // Basic validation - can be extended based on requirements
      if (!props.description) {
        return { isValid: false, message: 'Description is required.' };
      }
      return { isValid: true, message: '' };
    };

    const validation = validateProps();
    if (!validation.isValid) {
      setComponentState({ isLoading: false, error: validation.message });
    } else {
      setComponentState({ isLoading: false, error: null });
    }
  }, [props.description]);

  // Show loading state
  if (componentState.isLoading) {
    return (
      <IndicatorsLoadingSpinner 
        message="Initializing indicators and analysts..."
        size="large"
      />
    );
  }

  // Show error state
  if (componentState.error) {
    return (
      <div className={styles.indicatorsAndAnalysts}>
        <div className={styles.errorContainer}>
          <h3>Configuration Error</h3>
          <p>{componentState.error}</p>
          <p>Please check the web part properties and ensure all fields are configured correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <IndicatorsErrorBoundary>
      <div className={styles.indicatorsAndAnalysts}>
        <div className={styles.grid}>
          {/* Left Section - Indicators (3fr) */}
          <div className={styles.left}>
            <IndicatorsRefactored {...props} />
          </div>

          {/* Right Section - Complaint Analysts (1fr) */}
          <div className={styles.right}>
            <AnalystsRefactored
              listId={props.listId}
              analystsListId={props.analystsListId}
              spfxContext={props.spfxContext}
              title="Complaint Analysts"
              showTitle={true}
              showDetails={false}
              onAnalystClick={(analyst) => {
                console.log('Analyst selected:', analyst);
                // Handle analyst selection logic here
              }}
            />
          </div>
        </div>
      </div>
    </IndicatorsErrorBoundary>
  );
};

export default IndicatorsAndAnalystsRefactored;
