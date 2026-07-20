import React from "react";
import { CheckCircle2, ChevronRight, Trophy } from "lucide-react";
import { emptyState, loadingSpinner, loadingState } from "./studyTheme.css.ts";
import * as styles from "./StudyMilestones.css.ts";

const StudyMilestones = ({ milestones = [], userProgress = {}, loading = false, onToggle }) => {
  const totalCount = milestones.length;
  const completedCount = milestones.filter((milestone) => userProgress[milestone.id]?.completed).length;
  const remainingCount = Math.max(totalCount - completedCount, 0);
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const levelLabel = progress >= 100
    ? "Revolutionary Scholar"
    : progress >= 75
      ? "Level III Scholar"
      : progress >= 50
        ? "Level II Scholar"
        : progress >= 25
          ? "Level I Scholar"
          : "New Student";

  if (loading) {
    return (
      <section className={loadingState}>
        <div className={loadingSpinner} aria-label="Loading milestones" />
      </section>
    );
  }

  if (totalCount === 0) {
    return (
      <section className={emptyState}>No milestones defined yet.</section>
    );
  }

  return (
    <section className={styles.root}>
      <div className={styles.summary}>
        <div className={styles.summaryHeader}>
          <div>
            <p className={styles.summaryLabel}>Progress ledger</p>
            <h3 className={styles.summaryLevel}>{levelLabel}</h3>
            <p className={styles.summaryMeta}>
              Continue the current reading line and mark each finished study block to keep the archive in motion.
            </p>
          </div>
          <div className={styles.summaryValue}>{progress}% complete</div>
        </div>

        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <div className={styles.summaryStats}>
          <div className={styles.statTile}>
            <p className={styles.summaryLabel}>Completed</p>
            <p className={styles.statValue}>{completedCount}</p>
            <p className={styles.statCopy}>Finished milestones currently recorded.</p>
          </div>
          <div className={styles.statTile}>
            <p className={styles.summaryLabel}>Remaining</p>
            <p className={styles.statValue}>{remainingCount}</p>
            <p className={styles.statCopy}>Milestones still open in your present line of study.</p>
          </div>
        </div>
      </div>

      <div className={styles.timeline}>
        <div className={styles.timelineLine} aria-hidden="true" />

        {milestones.map((milestone) => {
          const isCompleted = userProgress[milestone.id]?.completed === true;
          const milestoneState = isCompleted ? "completed" : "pending";
          const title = milestone.title;
          const subtitle = milestone.description || "No description available yet.";

          return (
            <div key={milestone.id} className={styles.milestoneRow}>
              <div className={styles.milestoneBullet[milestoneState]} aria-hidden="true" />

              <button
                type="button"
                onClick={() => onToggle?.(milestone.id, !isCompleted)}
                className={`${styles.milestoneButton} ${styles.milestoneButtonState[milestoneState]}`}
              >
                <div className={styles.milestoneCopy}>
                  <h3 className={styles.milestoneTitle}>{title}</h3>
                  <p className={styles.milestoneSubtitle}>{subtitle}</p>
                  <div className={styles.milestoneMeta}>
                    {isCompleted ? "Completed entry" : "Click to mark complete"}
                  </div>
                </div>

                {isCompleted ? (
                  <CheckCircle2 size={18} className={styles.milestoneStateIcon.completed} />
                ) : (
                  <ChevronRight size={18} className={styles.milestoneStateIcon.pending} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StudyMilestones;