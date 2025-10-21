import * as React from 'react';
import styles from './GesRec.module.scss';
import { Icon, initializeIcons } from '@fluentui/react';
import type { IGesRecProps } from './IGesRecProps';
import { useUrlUtils } from '../hooks/useUrlUtils';
import { CourseService } from '../services/CourseService';
import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
import { ComponentState } from '../types';

initializeIcons();

/**
 * Main GesRec component with improved architecture patterns
 */
const GesRec: React.FC<IGesRecProps> = (props) => {
  const { toAbsoluteUrl } = useUrlUtils();
  const [componentState, setComponentState] = React.useState<ComponentState>({
    isLoading: false,
    error: null
  });

  // Memoize courses to prevent unnecessary re-renders
  const courses = React.useMemo(() => {
    return CourseService.getCourses({
      servicingAppUrl: props.servicingAppUrl,
      reportsUrl: props.reportsUrl,
      searchUrl: props.searchUrl
    });
  }, [props.servicingAppUrl, props.reportsUrl, props.searchUrl]);

  // Memoize icon mapping
  const iconMapping = React.useMemo(() => {
    return CourseService.getIconMapping();
  }, []);

  // Validate configuration
  const validation = React.useMemo(() => {
    return CourseService.validateConfig({
      servicingAppUrl: props.servicingAppUrl,
      reportsUrl: props.reportsUrl,
      searchUrl: props.searchUrl
    });
  }, [props.servicingAppUrl, props.reportsUrl, props.searchUrl]);

  // Handle configuration errors
  React.useEffect(() => {
    if (!validation.isValid) {
      setComponentState(prev => ({
        ...prev,
        error: validation.errors.join(', ')
      }));
    } else {
      setComponentState(prev => ({
        ...prev,
        error: null
      }));
    }
  }, [validation]);

  // Show loading state
  if (componentState.isLoading) {
    return <LoadingSpinner message="Loading GesRec..." />;
  }

  // Show error state
  if (componentState.error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Configuration Error</h3>
        <p>{componentState.error}</p>
        <p>Please check the web part properties and ensure all URLs are configured.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <section className={styles.wrapper}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Complaints</h1>
          <p className={styles.headerSubtitle}>
            Access application to submit, track, and resolve complaints in one place.
          </p>
          <a 
            className={styles.headerButton} 
            href={toAbsoluteUrl(props.complaintsAppUrl)}
            aria-label="Open Complaints Application"
          >
            Complaints App
            <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
              <path 
                d="M8 5l8 7-8 7" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        {/* Cards Section */}
        <div className={styles.cardsContainer}>
          {courses.map((course) => (
            <CourseCard 
              key={course.order}
              course={course}
              iconName={iconMapping[course.title]}
              toAbsoluteUrl={toAbsoluteUrl}
            />
          ))}
        </div>
      </section>
    </ErrorBoundary>
  );
};

/**
 * Individual course card component
 */
interface ICourseCardProps {
  course: import('../services/CourseService').Course;
  iconName: string;
  toAbsoluteUrl: (url?: string) => string;
}

const CourseCard: React.FC<ICourseCardProps> = ({ course, iconName, toAbsoluteUrl }) => {
  return (
    <article 
      className={styles.card} 
      style={{ backgroundColor: course.accent }}
      role="article"
      aria-label={`${course.title} - ${course.lessonsTotal} lessons`}
    >
      <div className={styles.cardIconContainer}>
        <Icon 
          iconName={iconName || 'Page'} 
          className={styles.cardIcon} 
          aria-hidden={true} 
        />
      </div>

      <h3 className={styles.cardTitle}>{course.title}</h3>

      <div className={styles.meta}>
        <a 
          href={toAbsoluteUrl(course.link)} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`Access ${course.title}`}
        >
          Access here
        </a>
      </div>
    </article>
  );
};

export default GesRec;
