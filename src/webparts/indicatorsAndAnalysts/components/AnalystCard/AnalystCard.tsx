import * as React from 'react';
import styles from './AnalystCard.module.scss';
import { AnalystCardProps } from '../../types/analysts';

/**
 * Individual analyst card component
 */
export const AnalystCard: React.FC<AnalystCardProps> = ({ 
  analyst, 
  className = '', 
  showDetails = false,
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(analyst);
    }
  };

  // Removed status color function since we simplified the data structure

  return (
    <div 
      className={`${styles.analystCard} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles.analystAvatar}>
        {analyst.avatarUrl ? (
          <img 
            src={analyst.avatarUrl} 
            alt={analyst.name}
            className={styles.avatarImage}
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const initialsDiv = target.nextElementSibling as HTMLElement;
              if (initialsDiv) {
                initialsDiv.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className={styles.avatarInitials}
          style={{ display: analyst.avatarUrl ? 'none' : 'flex' }}
        >
          {analyst.initials || analyst.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
        </div>
      </div>
      
      <div className={styles.analystInfo}>
        <h3 className={styles.analystName}>{analyst.name}</h3>
        <p className={styles.analystRole}>{analyst.role}</p>
      </div>
    </div>
  );
};
