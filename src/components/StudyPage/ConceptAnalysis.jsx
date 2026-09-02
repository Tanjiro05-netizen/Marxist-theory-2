import React from "react";
import { BookOpen, GitBranch, Users, FileText, Video, Headphones } from "lucide-react";
import { emptyState, loadingSpinner, loadingState } from "./studyTheme.css.ts";
import * as styles from "./ConceptAnalysis.css.ts";

const ICON_MAP = {
  BookOpen,
  GitBranch,
  Users,
  FileText,
  Video,
  Headphones,
};

const ConceptAnalysis = ({ concepts = [], loading = false }) => {
  if (loading) {
    return (
      <section className={loadingState}>
        <div className={loadingSpinner} aria-label="Loading concepts" />
      </section>
    );
  }

  if (concepts.length === 0) {
    return (
      <section className={emptyState}>No concepts defined yet.</section>
    );
  }

  return (
    <section className={styles.grid}>
      {concepts.map((item) => {
        const IconComp = ICON_MAP[item.icon_name] || BookOpen;

        return (
          <article key={item.id} className={styles.card}>
            <div className={styles.glow} aria-hidden="true" />

            <div className={styles.header}>
              <div className={styles.iconShell}>
                <IconComp size={24} />
              </div>
              <div className={styles.termBlock}>
                <h3 className={styles.term}>{item.term}</h3>
              </div>
            </div>

            <p className={styles.explanation}>
              {item.explanation}
            </p>
          </article>
        );
      })}
    </section>
  );
};

export default ConceptAnalysis;