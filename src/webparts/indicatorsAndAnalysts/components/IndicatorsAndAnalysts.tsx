import * as React from 'react';
import styles from './IndicatorsAndAnalysts.module.scss';
import type { IIndicatorsAndAnalystsProps } from './IIndicatorsAndAnalystsProps';
import Indicators from './Indicators';
import Analysts from './Analysts';

const IndicatorsAndAnalysts: React.FC<IIndicatorsAndAnalystsProps> = (props) => {
  return (
    <div className={styles.indicatorsAndAnalysts}>
      <div className={styles.wrapper}>
        <div className={styles.grid}>
          {/* Left: Indicators (3fr) */}
          <section className={styles.left} aria-labelledby="indicatorsTitle">
            <Indicators />
          </section>

          {/* Right: Analysts (1fr) */}
          <aside className={styles.right} aria-labelledby="analystsTitle">
            <Analysts />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default IndicatorsAndAnalysts;