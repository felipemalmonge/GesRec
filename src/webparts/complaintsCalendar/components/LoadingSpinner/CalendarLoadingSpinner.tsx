import * as React from 'react';
import styles from './CalendarLoadingSpinner.module.scss';

export interface ICalendarLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
  type?: 'calendar' | 'data' | 'general';
}

/**
 * Loading spinner component specifically designed for calendar operations
 */
export const CalendarLoadingSpinner: React.FC<ICalendarLoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading calendar...',
  className,
  type = 'calendar'
}) => {
  const getIcon = (): string => {
    switch (type) {
      case 'calendar':
        return '📅';
      case 'data':
        return '📊';
      default:
        return '⏳';
    }
  };

  return (
    <div className={`${styles.loadingContainer} ${className || ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.spinnerInner}>
          <span className={styles.spinnerIcon}>{getIcon()}</span>
        </div>
      </div>
      {message && <p className={styles.loadingMessage}>{message}</p>}
    </div>
  );
};
