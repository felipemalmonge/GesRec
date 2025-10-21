import * as React from 'react';
import styles from './GesRec.module.scss';
import { Icon, initializeIcons } from '@fluentui/react';
import type { IGesRecProps } from './IGesRecProps';
//import { escape } from '@microsoft/sp-lodash-subset';

type Course = {
  order: string;
  accent: string;
  title: string;
  lessonsTotal: number;
  progressPct: number;
  link: string;
};

initializeIcons();

function toAbsoluteUrl(input?: string): string {
  if (!input) return '#';
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed) || /^([\w-]+\.)+[\w-]+/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

const getCourses = (props: IGesRecProps): Course[] => [
  {
    order: '01',
    accent: '#C8E1F3',
    title: 'Servicing App',
    lessonsTotal: 24,
    progressPct: 45,
    link: props.servicingAppUrl || '#'
  },
  {
    order: '02',
    accent: '#C8E1F3',
    title: 'Reports',
    lessonsTotal: 18,
    progressPct: 70,
    link: props.reportsUrl || '#'
  },
  {
    order: '03',
    accent: '#C8E1F3',
    title: 'Search',
    lessonsTotal: 12,
    progressPct: 20,
    link: props.searchUrl || '#'
  }
];

const titleToIconName: Record<string, string> = {
  'Servicing App': 'ReminderGroup',
  'Reports': 'ReportDocument',
  'Search Complaints': 'Search'
};

const GesRec: React.FC<IGesRecProps> = (props) => {
  const courses = getCourses(props);

    return (
      <section className={styles.wrapper}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>Complaints</h1>
          <p className={styles.headerSubtitle}>Access application to submit, track, and resolve complaints in one place.</p>
          <a className={styles.headerButton} href={toAbsoluteUrl(props.complaintsAppUrl)}>
            Complaints App
            <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        {/* Cards Section */}
        <div className={styles.cardsContainer}>
          {courses.slice(0, 3).map((c) => (
            <article key={c.order} className={styles.card} style={{ backgroundColor: c.accent }}>
              {/* <header className={styles.cardTop}>
                <span className={styles.order}>{c.order}</span>
                <button className={styles.kebab} aria-label="More options">⋮</button>
              </header> */}

              <div className={styles.cardIconContainer}>
                <Icon iconName={titleToIconName[c.title] || 'Page'} className={styles.cardIcon} aria-hidden={true} />
              </div>

              <h3 className={styles.cardTitle}>{c.title}</h3>

              <div className={styles.meta}>
                <a href={toAbsoluteUrl(c.link)} target="_blank" rel="noopener noreferrer">Access here</a>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  export default GesRec;