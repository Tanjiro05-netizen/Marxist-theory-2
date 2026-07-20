import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Headphones,
  Library,
  Play,
  Search,
  Settings,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import StudyResources from "../components/StudyPage/StudyResources";
import StudyMilestones from "../components/StudyPage/StudyMilestones";
import StudyPathAI from "../components/StudyPage/StudyPathAI";
import StudyPathGenerator from "../components/AIFeatures/StudyPathGenerator";
import marxBackground from "../assets/Marx.jpg";
import ConceptAnalysis from "../components/StudyPage/ConceptAnalysis";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import * as styles from "./StudyPage.css.ts";
import {
  actionButton,
  ambientOrb,
  badge,
  filterPill,
  iconFrame,
  panelDescription,
  panelTitle,
  sectionDescription,
  sectionEyebrow,
  sectionHeader,
  sectionHeaderStack,
  sectionTitle,
  studyThemeClass,
  themeRoot,
} from "../components/StudyPage/studyTheme.css.ts";

const marxBackgroundUrl =
  typeof marxBackground === "string" ? marxBackground : marxBackground.src;

const NAV_ITEMS = [
  { label: "Resources", icon: BookOpen },
  { label: "Texts", icon: FileText },
  { label: "Lectures", icon: Video },
];

const StudyPage = () => {
  const { user, canManageStudy } = useAuth();
  const showAdminLink = canManageStudy();
  const [generatedPath, setGeneratedPath] = useState(null);

  const [resources, setResources] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingConcepts, setLoadingConcepts] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNavTab, setActiveNavTab] = useState("Resources");

  const handlePathGenerated = useCallback((path) => {
    setGeneratedPath(path);
  }, []);


  useEffect(() => {
    const fetchResources = async () => {
      setLoadingResources(true);
      try {
        const { data, error } = await supabase
          .from("study_resources")
          .select("*")
          .order("sort_order");
        if (error) throw error;
        setResources(data || []);
      } catch (err) {
        console.error("Error fetching study resources:", err);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, []);

  useEffect(() => {
    const fetchConcepts = async () => {
      setLoadingConcepts(true);
      try {
        const { data, error } = await supabase
          .from("study_concepts")
          .select("*")
          .order("sort_order");
        if (error) throw error;
        setConcepts(data || []);
      } catch (err) {
        console.error("Error fetching study concepts:", err);
      } finally {
        setLoadingConcepts(false);
      }
    };

    fetchConcepts();
  }, []);

  useEffect(() => {
    const fetchMilestones = async () => {
      setLoadingMilestones(true);
      try {
        const { data: milestoneData, error: milestoneError } = await supabase
          .from("study_milestones")
          .select("*")
          .order("sort_order");
        if (milestoneError) throw milestoneError;
        setMilestones(milestoneData || []);

        if (user && user.id !== "dev-admin") {
          const { data: progressData, error: progressError } = await supabase
            .from("study_user_progress")
            .select("*")
            .eq("user_id", user.id);
          if (progressError) throw progressError;

          const progressMap = {};
          (progressData || []).forEach((row) => {
            progressMap[row.milestone_id] = row;
          });
          setUserProgress(progressMap);
        }
      } catch (err) {
        console.error("Error fetching study milestones:", err);
      } finally {
        setLoadingMilestones(false);
      }
    };

    fetchMilestones();
  }, [user]);

  const handleToggleMilestone = useCallback(async (milestoneId, shouldComplete) => {
    if (!user || user.id === "dev-admin") return;

    const now = new Date().toISOString();

    try {
      if (shouldComplete) {
        const { error } = await supabase
          .from("study_user_progress")
          .upsert({
            user_id: user.id,
            milestone_id: milestoneId,
            completed: true,
            completed_at: now,
          }, { onConflict: "user_id,milestone_id" });
        if (error) throw error;

        setUserProgress((prev) => ({
          ...prev,
          [milestoneId]: { ...prev[milestoneId], completed: true, completed_at: now },
        }));
      } else {
        const { error } = await supabase
          .from("study_user_progress")
          .update({ completed: false, completed_at: null })
          .eq("user_id", user.id)
          .eq("milestone_id", milestoneId);
        if (error) throw error;

        setUserProgress((prev) => ({
          ...prev,
          [milestoneId]: { ...prev[milestoneId], completed: false, completed_at: null },
        }));
      }
    } catch (err) {
      console.error("Error toggling milestone:", err);
    }
  }, [user]);

  const lectureResources = useMemo(
    () => resources.filter((resource) => resource.type === "video" || resource.type === "lecture"),
    [resources]
  );

  const filteredResources = useMemo(() => {
    let filtered = resources;

    if (activeNavTab === "Texts") {
      filtered = filtered.filter((resource) => resource.type === "text");
    } else if (activeNavTab === "Lectures") {
      filtered = filtered.filter((resource) => resource.type === "video" || resource.type === "lecture");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((resource) =>
        `${resource.title} ${resource.excerpt || ""} ${resource.author || ""} ${resource.category || ""}`
          .toLowerCase()
          .includes(query)
      );
    }

    return filtered;
  }, [activeNavTab, resources, searchQuery]);

  const completedCount = useMemo(
    () => milestones.filter((milestone) => userProgress[milestone.id]?.completed).length,
    [milestones, userProgress]
  );

  const remainingCount = Math.max(milestones.length - completedCount, 0);

  const nextMilestone = useMemo(
    () => milestones.find((milestone) => !userProgress[milestone.id]?.completed) || null,
    [milestones, userProgress]
  );

  const nextResource = useMemo(() => {
    if (nextMilestone?.resource_id) {
      const linkedResource = resources.find((resource) => resource.id === nextMilestone.resource_id);
      if (linkedResource) return linkedResource;
    }

    return resources.find((resource) => resource.is_featured) || resources[0] || null;
  }, [nextMilestone, resources]);


  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className={`${themeRoot} ${styles.page}`}>
      <div className={`${ambientOrb} ${styles.heroOrbLeft}`} />
      <div className={`${ambientOrb} ${styles.heroOrbRight}`} />
      <div className={`${ambientOrb} ${styles.lowerOrb}`} />

      <section className={styles.hero}>
        <div className={styles.heroBackdrop}>
          <img src={marxBackgroundUrl} alt="Study Center archive" className={styles.heroImage} />
          <div className={styles.heroScrim} />
          <div className={styles.heroNoise} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>
                <Sparkles size={12} />
                Revolutionary Theory Center
              </span>

              <div className={styles.heroCopy}>
                <p className={sectionEyebrow}>Obsidian archive</p>
                <h1 className={styles.heroTitle}>Study Center</h1>
                <p className={styles.heroQuote}>
                  “Without revolutionary theory there can be no revolutionary movement.”
                </p>
                <p className={styles.heroLead}>
                  A hand-curated reading and lecture archive for disciplined study: texts, concepts, milestones,
                  and guided AI assistance gathered into one editorial surface.
                </p>
              </div>

              <div className={styles.searchShell}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search theories, concepts, or resources..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  onClick={() => setActiveNavTab("Resources")}
                  className={actionButton({ tone: "accent", size: "md" })}
                >
                  Search archive
                </button>
              </div>

              <div className={styles.heroMetaRow}>
                <span className={badge({ tone: "accent" })}>
                  {nextMilestone ? "Next milestone queued" : "Current line complete"}
                </span>
                <span className={badge({ tone: "default" })}>
                  {resources.filter((resource) => resource.is_featured).length} featured entries
                </span>
                {showAdminLink && (
                  <span className={badge({ tone: "info" })}>Editorial access</span>
                )}
              </div>

              <div className={styles.heroStatGrid}>
                <article className={styles.statCard}>
                  <p className={styles.statLabel}>Archive Entries</p>
                  <p className={styles.statValue}>{resources.length}</p>
                  <p className={styles.statNote}>Texts, lectures, and audio resources currently indexed.</p>
                </article>
                <article className={styles.statCard}>
                  <p className={styles.statLabel}>Key Concepts</p>
                  <p className={styles.statValue}>{concepts.length}</p>
                  <p className={styles.statNote}>Core analytical frames explained inside the Study Center itself.</p>
                </article>
                <article className={styles.statCard}>
                  <p className={styles.statLabel}>Lecture Index</p>
                  <p className={styles.statValue}>{lectureResources.length}</p>
                  <p className={styles.statNote}>Recent lecture and video material ready for guided screening.</p>
                </article>
                <article className={styles.statCard}>
                  <p className={styles.statLabel}>Progress</p>
                  <p className={styles.statValue}>{progressPercent}%</p>
                  <p className={styles.statNote}>
                    {milestones.length > 0
                      ? `${remainingCount} milestones remain in your current line of study.`
                      : "Milestones are being prepared for the archive."}
                  </p>
                </article>
              </div>
              
              {/* AI Study Path Generator */}
              {!generatedPath && (
                <div className="mt-6">
                  <StudyPathGenerator onPathGenerated={handlePathGenerated} compact />
                </div>
              )}
            </div>

            <aside className={styles.heroAside}>
              <div className={styles.featurePanel}>
                <div className={styles.featureHeader}>
                  <div>
                    <p className={sectionEyebrow}>Current line of study</p>
                    <h2 className={styles.featureTitle}>
                      {nextMilestone ? nextMilestone.title : "Archive complete"}
                    </h2>
                  </div>
                  <div className={iconFrame}>
                    <BookOpen size={20} />
                  </div>
                </div>

                <p className={styles.featureCopy}>
                  {nextMilestone
                    ? (nextMilestone.description || "Advance this milestone to keep the present reading line in motion.")
                    : "You have completed the currently defined line of study. Continue through the archive for deeper secondary readings while new milestones are prepared."}
                </p>

                <div className={styles.featureActionRow}>
                  <button
                    type="button"
                    onClick={() => setActiveNavTab("Texts")}
                    className={actionButton({ tone: "accent", size: "sm" })}
                  >
                    Open texts
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNavTab("Lectures")}
                    className={actionButton({ tone: "ghost", size: "sm" })}
                  >
                    View lectures
                  </button>
                  <Link href="/digital-library" className={actionButton({ tone: "subtle", size: "sm" })}>
                    Library
                  </Link>
                </div>

                <div className={styles.featureList}>
                  <div className={styles.featureListItem}>
                    <p className={styles.featureItemLabel}>Recommended resource</p>
                    <p className={styles.featureItemValue}>
                      {nextResource
                        ? `${nextResource.title}${nextResource.author ? ` — ${nextResource.author}` : ""}`
                        : "Browse the resource archive to begin a new reading line."}
                    </p>
                  </div>
                  <div className={styles.featureListItem}>
                    <p className={styles.featureItemLabel}>Progress status</p>
                    <p className={styles.featureItemValue}>
                      {milestones.length > 0
                        ? `${completedCount} of ${milestones.length} milestones have been marked complete.`
                        : "Milestones will appear here as the editorial archive expands."}
                    </p>
                  </div>

                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* AI Study Path Generator Section */}
      {generatedPath && (
        <section className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-black/40 border border-red-900/30 rounded-2xl p-6">
            <StudyPathGenerator studyPath={generatedPath} onPathGenerated={handlePathGenerated} />
          </div>
        </section>
      )}

      <div className={styles.commandBar}>
        <div className={styles.commandBarInner}>
          <div className={styles.commandFilters}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveNavTab(item.label)}
                className={filterPill({ active: activeNavTab === item.label })}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.commandActions}>
            <Link href="/digital-library" className={actionButton({ tone: "ghost", size: "sm" })}>
              <Library size={14} />
              Digital Library
            </Link>
            {showAdminLink && (
              <Link href="/admin/study" className={actionButton({ tone: "subtle", size: "sm" })}>
                <Settings size={14} />
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      <section className={styles.layout}>
        <div className={styles.editorialGrid}>
          <aside className={styles.rail}>
            <div className={styles.sidePanel}>
              <div className={sectionHeader}>
                <div className={sectionHeaderStack}>
                  <p className={sectionEyebrow}>Guidance</p>
                  <h2 className={panelTitle}>AI Path & Guidance</h2>
                  <p className={panelDescription}>
                    Use the path view for ordered study and the assistant tab for quick archive guidance.
                  </p>
                </div>
              </div>
              <StudyPathAI milestones={milestones} resources={resources} userProgress={userProgress} />
            </div>

            <div className={styles.sidePanel}>
              <div className={sectionHeader}>
                <div className={sectionHeaderStack}>
                  <p className={sectionEyebrow}>Ledger</p>
                  <h2 className={panelTitle}>Progress Ledger</h2>
                  <p className={panelDescription}>
                    Mark completed study blocks and keep your current line visible at a glance.
                  </p>
                </div>
              </div>
              <StudyMilestones
                milestones={milestones}
                userProgress={userProgress}
                loading={loadingMilestones}
                onToggle={handleToggleMilestone}
              />
            </div>


          </aside>

          <div className={styles.main}>
            <div className={styles.mainPanel}>
              <div className={sectionHeader}>
                <div className={sectionHeaderStack}>
                  <p className={sectionEyebrow}>Archive entries</p>
                  <h2 className={sectionTitle}>Study Resources</h2>
                  <p className={sectionDescription}>
                    Curated materials for disciplined theoretical development across texts, lectures, and related media.
                  </p>
                </div>
                <Link href="/digital-library" className={actionButton({ tone: "ghost", size: "sm" })}>
                  <Library size={14} />
                  Browse library
                </Link>
              </div>
              <StudyResources
                resources={filteredResources}
                loading={loadingResources}
                hideFilter={activeNavTab !== "Resources"}
              />
            </div>

            <div className={styles.mainPanel}>
              <div className={sectionHeader}>
                <div className={sectionHeaderStack}>
                  <p className={sectionEyebrow}>Theory index</p>
                  <h2 className={sectionTitle}>Key Concepts</h2>
                  <p className={sectionDescription}>
                    A self-contained concept shelf for recurring theoretical terms used throughout the archive.
                  </p>
                </div>
              </div>
              <ConceptAnalysis concepts={concepts} loading={loadingConcepts} />
            </div>

            {lectureResources.length > 0 && activeNavTab !== "Lectures" && (
              <div className={styles.mainPanel}>
                <div className={sectionHeader}>
                  <div className={sectionHeaderStack}>
                    <p className={sectionEyebrow}>Screenings</p>
                    <h2 className={sectionTitle}>Latest Lectures</h2>
                    <p className={sectionDescription}>
                      Recent lecture material arranged with the same editorial hierarchy as the reading archive.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNavTab("Lectures")}
                    className={actionButton({ tone: "ghost", size: "sm" })}
                  >
                    View lecture archive
                  </button>
                </div>

                <div className={styles.lecturesGrid}>
                  {lectureResources.slice(0, 3).map((item) => {
                    const lectureHref = item.digital_library_book_id
                      ? `/book/${item.digital_library_book_id}`
                      : item.content_url || "";
                    const isExternal = lectureHref.startsWith("http");

                    const lectureCard = (
                      <>
                        <div className={styles.lectureVisual}>
                          {item.cover_image_url ? (
                            <img src={item.cover_image_url} alt={item.title} className={styles.lectureImage} />
                          ) : null}
                          <div className={styles.lectureOverlay}>
                            <div className={styles.lecturePlay}>
                              <Video size={18} />
                            </div>
                          </div>
                        </div>
                        <div className={styles.lectureBody}>
                          <span className={badge({ tone: "info" })}>
                            {item.type === "lecture" ? "Lecture" : "Video"}
                          </span>
                          <h3 className={styles.lectureTitle}>{item.title}</h3>
                          <p className={styles.lectureMeta}>
                            {item.author || "Study Center"}
                            {item.category ? ` · ${item.category}` : ""}
                          </p>
                        </div>
                      </>
                    );

                    if (!lectureHref) {
                      return (
                        <div key={item.id} className={styles.lectureCard}>
                          {lectureCard}
                        </div>
                      );
                    }

                    return isExternal ? (
                      <a
                        key={item.id}
                        href={lectureHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.lectureCard}
                      >
                        {lectureCard}
                      </a>
                    ) : (
                      <Link key={item.id} href={lectureHref} className={styles.lectureCard}>
                        {lectureCard}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudyPage;
