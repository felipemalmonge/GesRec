import * as React from 'react';
import styles from './LoadingSpinner.module.scss';

export interface ILoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

/**
 * Loading spinner component with customizable size and message
 */
export const LoadingSpinner: React.FC<ILoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  className
}) => {
  return (
    <div className={`${styles.loadingContainer} ${className || ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.spinnerInner}></div>
      </div>
      {message && <p className={styles.loadingMessage}>{message}</p>}
    </div>
  );
};
