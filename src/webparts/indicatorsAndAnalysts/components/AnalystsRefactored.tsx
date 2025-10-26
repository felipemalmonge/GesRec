import * as React from 'react';
import styles from './AnalystsRefactored.module.scss';
import { AnalystCard } from './AnalystCard/AnalystCard';
import { useAnalystsData } from '../hooks/useAnalystsData';
import { AnalystData } from '../types/analysts';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IAnalystsRefactoredProps {
  listId?: string;
  analystsListId?: string;
  spfxContext: WebPartContext;
  title?: string;
  showTitle?: boolean;
  className?: string;
  showDetails?: boolean;
  onAnalystClick?: (analyst: AnalystData) => void;
}

/**
 * Refactored Analysts component with improved architecture patterns
 * Implements best practices: custom hooks, error boundaries, loading states
 */
const AnalystsRefactored: React.FC<IAnalystsRefactoredProps> = (props) => {
  const {
    listId,
    analystsListId,
    spfxContext,
    title = 'Complaint Analysts',
    showTitle = true,
    className = '',
    showDetails = false,
    onAnalystClick
  } = props;

  console.log('AnalystsRefactored component rendered with props:', { 
    listId, 
    analystsListId, 
    hasContext: !!spfxContext,
    title,
    showDetails
  });

  // Use custom hook for analysts data
  const analystsData = useAnalystsData({
    listId,
    analystsListId,
    spfxContext
  });

  const handleAnalystClick = (analyst: AnalystData) => {
    console.log('Analyst clicked:', analyst);
    if (onAnalystClick) {
      onAnalystClick(analyst);
    }
  };

  // Show loading state
  if (analystsData.loading) {
    return (
      <div className={`${styles.analystsSection} ${className}`}>
        {showTitle && <h2 className={styles.analystsTitle}>{title}</h2>}
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading analysts...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (analystsData.error) {
    return (
      <div className={`${styles.analystsSection} ${className}`}>
        {showTitle && <h2 className={styles.analystsTitle}>{title}</h2>}
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3 className={styles.errorTitle}>Error Loading Analysts</h3>
          <p className={styles.errorMessage}>{analystsData.error}</p>
          <p className={styles.errorHint}>
            Please check the web part properties and ensure the analysts list is configured correctly.
          </p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!analystsData.analysts || analystsData.analysts.length === 0) {
    return (
      <div className={`${styles.analystsSection} ${className}`}>
        {showTitle && <h2 className={styles.analystsTitle}>{title}</h2>}
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>👥</div>
          <h3 className={styles.emptyTitle}>No Analysts Found</h3>
          <p className={styles.emptyMessage}>
            No analysts are currently available. Please check your configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.analystsSection} ${className}`}>
      {showTitle && <h2 className={styles.analystsTitle}>{title}</h2>}
      
      <div className={styles.analystsContent}>
        {analystsData.analysts.map((analyst: AnalystData) => (
          <AnalystCard
            key={analyst.id}
            analyst={analyst}
            showDetails={showDetails}
            onClick={handleAnalystClick}
            className={styles.analystCard}
          />
        ))}
      </div>

    </div>
  );
};

export default AnalystsRefactored;
