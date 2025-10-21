import * as React from 'react';
import styles from './IndicatorsAndAnalystsRefactored.module.scss';
import { IndicatorsErrorBoundary } from './ErrorBoundary/IndicatorsErrorBoundary';
import { IndicatorsLoadingSpinner } from './LoadingSpinner/IndicatorsLoadingSpinner';
import IndicatorsRefactored from './IndicatorsRefactored';
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
            <div className={styles.analystsSection}>
              <h2 className={styles.analystsTitle}>Complaint Analysts</h2>
              <div className={styles.analystsContent}>
                <div className={styles.analystCard}>
                  <div className={styles.analystAvatar}>
                    <img 
                      src="https://via.placeholder.com/60x60/0078d4/ffffff?text=JD" 
                      alt="John Doe"
                      className={styles.avatarImage}
                    />
                  </div>
                  <div className={styles.analystInfo}>
                    <h3 className={styles.analystName}>John Doe</h3>
                    <p className={styles.analystRole}>Senior Analyst</p>
                    <p className={styles.analystStatus}>Available</p>
                  </div>
                </div>

                <div className={styles.analystCard}>
                  <div className={styles.analystAvatar}>
                    <img 
                      src="https://via.placeholder.com/60x60/28a745/ffffff?text=JS" 
                      alt="Jane Smith"
                      className={styles.avatarImage}
                    />
                  </div>
                  <div className={styles.analystInfo}>
                    <h3 className={styles.analystName}>Jane Smith</h3>
                    <p className={styles.analystRole}>Analyst</p>
                    <p className={styles.analystStatus}>Busy</p>
                  </div>
                </div>

                <div className={styles.analystCard}>
                  <div className={styles.analystAvatar}>
                    <img 
                      src="https://via.placeholder.com/60x60/ffc107/ffffff?text=MB" 
                      alt="Mike Brown"
                      className={styles.avatarImage}
                    />
                  </div>
                  <div className={styles.analystInfo}>
                    <h3 className={styles.analystName}>Mike Brown</h3>
                    <p className={styles.analystRole}>Junior Analyst</p>
                    <p className={styles.analystStatus}>Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IndicatorsErrorBoundary>
  );
};

export default IndicatorsAndAnalystsRefactored;
