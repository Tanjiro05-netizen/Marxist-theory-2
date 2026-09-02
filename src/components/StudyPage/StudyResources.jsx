import React, { useState } from "react";
import { BookOpen, Video, Headphones, ArrowRight, Library } from "lucide-react";
import Link from 'next/link';
import { emptyState, loadingSpinner, loadingState } from "./studyTheme.css.ts";
import * as styles from "./StudyResources.css.ts";

const categories = ["All", "text", "video", "lecture"];
const categoryLabels = { All: "All", text: "Text", video: "Video", lecture: "Lecture" };

const typeIconMap = {
  video: <Video size={18} />,
  audio: <Headphones size={18} />,
  lecture: <Video size={18} />,
  text: <BookOpen size={18} />,
};

const StudyResources = ({ resources = [], loading = false, hideFilter = false }) => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredResources = activeCategory === "All"
    ? resources
    : resources.filter(res => res.type === activeCategory);

  return (
    <section className={styles.root}>
      {!hideFilter && (
        <div className={styles.filterBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={styles.filterButton({ active: activeCategory === cat })}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={loadingState}>
          <div className={loadingSpinner} aria-label="Loading study resources" />
        </div>
      ) : filteredResources.length === 0 ? (
        <p className={emptyState}>No resources match this filter yet.</p>
      ) : (
        <div className={styles.list}>
          {filteredResources.map((res) => {
            const typeKey = typeIconMap[res.type] ? res.type : 'text';
            const icon = typeIconMap[typeKey];
            const href = res.digital_library_book_id
              ? `/book/${res.digital_library_book_id}`
              : res.content_url || '#';
            const isExternal = href.startsWith('http');

            return (
              <div
                key={res.id}
                className={`${styles.card} ${res.is_featured ? styles.featuredCard : ''}`}
              >
                <div className={styles.iconFrame[typeKey]}>
                  {icon}
                </div>

                <div className={styles.content}>
                  <div className={styles.badgeRow}>
                    <span className={styles.typeBadge[typeKey]}>
                      {categoryLabels[typeKey] || typeKey}
                    </span>
                    {res.is_featured && (
                      <span className={styles.featuredBadge}>
                        Featured
                      </span>
                    )}
                    {res.digital_library_book_id && (
                      <span className={styles.libraryBadge}>
                        <Library size={12} /> In Library
                      </span>
                    )}
                  </div>

                  <h3 className={styles.title}>{res.title}</h3>

                  {res.author && (
                    <p className={styles.author}>{res.author}</p>
                  )}

                  <p className={styles.excerpt}>
                    {res.excerpt || 'No description available.'}
                  </p>

                  <div className={styles.footer}>
                    <p className={styles.meta}>
                      {res.category || categoryLabels[typeKey] || typeKey}
                    </p>
                    {isExternal ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.action}
                      >
                        Open <ArrowRight size={14} />
                      </a>
                    ) : (
                      <Link href={href}
                        className={styles.action}
                      >
                        Read <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default StudyResources;