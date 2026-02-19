import * as React from 'react';
import { Icon } from '@fluentui/react';
import styles from './StatCard.module.scss';
import { IndicatorData } from '../../types';

const iconNameByIndicator: Record<string, string> = {
  complaints: 'Warning',
  'answer-limit': 'Calendar',
  clarifications: 'TextDocument'
};

interface StatCardProps {
  indicator: IndicatorData;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

/**
 * Individual stat card component for displaying indicator data
 * Follows the 2-row layout: icon on top, number and text below
 */
export const StatCard: React.FC<StatCardProps> = ({ 
  indicator, 
  showIcon = true, 
  showDescription = true,
  className = '' 
}) => {
  const cardClass = `${styles.statCard} ${className}`;
  const iconName = iconNameByIndicator[indicator.id] || 'Info';

  return (
    <div className={cardClass}>
      {/* First Row: Icon */}
      {showIcon && (
        <div className={styles.iconRow}>
          <div className={styles.iconContainer}>
            <Icon iconName={iconName} className={styles.statIcon} />
          </div>
        </div>
      )}

      {/* Second Row: Number and Text */}
      <div className={styles.contentRow}>
        <div className={styles.statNumber} style={{ color: indicator.color }}>
          {indicator.value}
        </div>
        <div className={styles.statText}>
          {indicator.title}
        </div>
        {showDescription && indicator.description && (
          <div className={styles.statDescription}>
            {indicator.description}
          </div>
        )}
      </div>
    </div>
  );
};
