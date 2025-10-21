import * as React from 'react';
import styles from './Indicators.module.scss';

const Indicators: React.FC = () => {
  return (
    <div className={styles.section}>
      <h2 id="indicatorsTitle" className={styles.title}>Indicators</h2>
      
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statRow1}>
            <img src={require('../assets/bad-review.png')} alt="Bad Review" className={styles.statIcon} />
          </div>
          <div className={styles.statRow2}>
            <div className={styles.statNumber}>2</div>
            <div className={styles.statText}>Total complaints (Status not closed)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statRow1}>
            <img src={require('../assets/calendar.png')} alt="Calendar" className={styles.statIcon} />
          </div>
          <div className={styles.statRow2}>
            <div className={styles.statNumber}>3</div>
            <div className={styles.statText}>Answer Limit Date Today</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statRow1}>
            <img src={require('../assets/file.png')} alt="File" className={styles.statIcon} />
          </div>
          <div className={styles.statRow2}>
            <div className={styles.statNumber}>8</div>
            <div className={styles.statText}>Clarifications Pending</div>
          </div>
        </div>

        {/* <div className={`${styles.statCard}`}>
          <Icon iconName="Help" className={styles.statIcon} />
          <div className={styles.statCol}>
            <div className={styles.statNumber}>8</div>
            <div className={styles.statText}>Clarifications Pending</div>
          </div> */}

          {/* Decorative mini chart */}
          {/* <div className={styles.chart} role="img" aria-label="Activity trend">
            <svg viewBox="0 0 200 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7c6cf6" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#7c6cf6" stopOpacity="0.05"/>
                </linearGradient>
              </defs>
              <path d="M0 70 C30 20, 50 40, 80 30 S130 60, 160 40 200 60, 200 60 L200 100 L0 100 Z" fill="url(#g)"/>
              <path d="M0 70 C30 20, 50 40, 80 30 S130 60, 160 40 200 60" fill="none" stroke="#7c6cf6" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div> */}
        {/* </div> */}
      </div>
    </div>
  );
};

export default Indicators;
