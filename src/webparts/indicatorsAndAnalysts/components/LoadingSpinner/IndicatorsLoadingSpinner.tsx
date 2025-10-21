import * as React from 'react';
import styles from './IndicatorsLoadingSpinner.module.scss';

interface IndicatorsLoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Loading spinner component specifically for the Indicators component
 * Provides visual feedback during data loading operations
 */
export const IndicatorsLoadingSpinner: React.FC<IndicatorsLoadingSpinnerProps> = ({ 
  message = "Loading indicators...", 
  size = "medium" 
}) => {
  const spinnerClass = `${styles.spinner} ${styles[size]}`;
  
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinnerWrapper}>
        <div className={spinnerClass}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      {message && (
        <div className={styles.loadingContent}>
          <p className={styles.loadingMessage}>{message}</p>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
    </div>
  );
};
