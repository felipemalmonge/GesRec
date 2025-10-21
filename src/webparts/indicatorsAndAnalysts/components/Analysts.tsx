import * as React from 'react';
import styles from './Analysts.module.scss';

const Analysts: React.FC = () => {
  return (
    <div className={styles.panel}>
      <h3 id="analystsTitle" className={styles.title}>Complaint Analysts</h3>
      
      <ul className={styles.people}>
        <li className={styles.person}>
          <span className={styles.avatar}>
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" alt="Vera Taklim" />
          </span>
          <div>
            <p className={styles.pName}>Vera Taklim</p>
            <p className={styles.pRole}>Complaints Analyst</p>
          </div>
        </li>

        <li className={styles.person}>
          <span className={styles.avatar} aria-hidden="true">PF</span>
          <div>
            <p className={styles.pName}>Pedro Filipe</p>
            <p className={styles.pRole}>Attorney</p>
          </div>
        </li>

        <li className={styles.person}>
          <span className={styles.avatar} aria-hidden="true">
            {/* simple grey silhouette */}
            <svg viewBox="0 0 64 64" width="44" height="44">
              <circle cx="32" cy="24" r="12" fill="#cfd4dc"/>
              <path d="M12 56c4-10 14-16 20-16s16 6 20 16" fill="#cfd4dc"/>
            </svg>
          </span>
          <div>
            <p className={styles.pName}>Helia Ferreira</p>
            <p className={styles.pRole}>Head of Legal - Hospitality · Sports & Leisure</p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Analysts;
