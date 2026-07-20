import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { BookOpen, Video, Headphones, Send, Bot, User, Sparkles, MessageSquare, Map, CheckCircle2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { emptyState } from "./studyTheme.css.ts";
import * as styles from "./StudyPathAI.css.ts";

const TYPE_ICONS = {
  text: BookOpen,
  video: Video,
  audio: Headphones,
  lecture: Video,
};

const normalizeSources = (sources) =>
  Array.isArray(sources)
    ? sources.filter((source) => source?.title).slice(0, 6)
    : [];

const SourceChips = ({ sources = [] }) => {
  const visibleSources = normalizeSources(sources);
  if (visibleSources.length === 0) return null;

  return (
    <div className={styles.sourceList} aria-label="Sources used">
      <span className={styles.sourceListLabel}>Sources used</span>
      {visibleSources.map((source, index) => {
        const marker = source.marker || `S${index + 1}`;
        const content = (
          <>
            <span className={styles.sourceMarker}>{marker}</span>
            <span className={styles.sourceTitle}>{source.title}</span>
          </>
        );

        return source.href ? (
          <a
            key={`${marker}-${source.title}`}
            href={source.href}
            className={styles.sourceChip}
            target={source.href.startsWith("http") ? "_blank" : undefined}
            rel={source.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {content}
          </a>
        ) : (
          <span key={`${marker}-${source.title}`} className={styles.sourceChip}>
            {content}
          </span>
        );
      })}
    </div>
  );
};

const StudyPathAI = ({ milestones = [], resources = [], userProgress = {} }) => {
  const incompleteMilestones = useMemo(
    () => milestones.filter((milestone) => !userProgress[milestone.id]?.completed),
    [milestones, userProgress]
  );

  const nextMilestone = incompleteMilestones[0] || null;

  const recommendationText = nextMilestone
    ? `Based on your current archive, the next recommended milestone is "${nextMilestone.title}".`
    : milestones.length > 0
      ? "You have completed all available milestones in this line of study."
      : "No milestones are available yet. Explore the archive while new study blocks are prepared.";

  const pathSteps = useMemo(() => {
    return milestones.map((milestone, index) => {
      const linkedResource = resources.find((resource) => resource.id === milestone.resource_id);
      const completed = userProgress[milestone.id]?.completed === true;
      const IconComp = linkedResource ? (TYPE_ICONS[linkedResource.type] || BookOpen) : BookOpen;

      return {
        step: index + 1,
        title: milestone.title,
        subtitle: milestone.description || "",
        suggestion: linkedResource
          ? `Suggested resource: ${linkedResource.title}`
          : (milestone.description || "Complete this milestone to continue your reading line."),
        IconComp,
        completed,
      };
    });
  }, [milestones, resources, userProgress]);

  const [activeTab, setActiveTab] = useState("path");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hello. I can help map your next reading steps, explain concepts, and surface the most relevant Study Center materials.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const buildContext = useCallback(() => {
    const completedCount = milestones.filter((milestone) => userProgress[milestone.id]?.completed).length;

    return {
      milestones: milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        resource_id: milestone.resource_id,
        completed: !!userProgress[milestone.id]?.completed,
      })),
      resources: resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        author: resource.author,
        category: resource.category,
        digital_library_book_id: resource.digital_library_book_id,
      })),
      completedCount,
      totalCount: milestones.length,
      nextMilestone: nextMilestone?.title || null,
    };
  }, [milestones, resources, userProgress, nextMilestone]);

  const getLocalFallback = useCallback((userInput) => {
    const lower = userInput.toLowerCase();

    if (lower.includes("path") || lower.includes("plan") || lower.includes("next")) {
      return nextMilestone
        ? `Your next milestone is "${nextMilestone.title}". ${nextMilestone.description || ""}`
        : milestones.length > 0
          ? "You have completed all current milestones. Continue exploring the archive for deeper study."
          : "No milestones are available yet. Try starting with the featured texts in Study Resources.";
    }

    if (lower.includes("progress") || lower.includes("done") || lower.includes("completed")) {
      const completed = milestones.filter((milestone) => userProgress[milestone.id]?.completed).length;
      return `You have completed ${completed} of ${milestones.length} milestones. ${completed < milestones.length ? "Keep advancing the reading line." : "The current archive line is complete."}`;
    }

    if (lower.includes("book") || lower.includes("read") || lower.includes("text")) {
      const textResources = resources.filter((resource) => resource.type === "text");
      return textResources.length > 0
        ? `Available texts include ${textResources.map((resource) => `"${resource.title}"`).join(", ")}. Start with the featured archive entries if you want a guided line.`
        : "No text resources are available yet. Check back soon for additions to the archive.";
    }

    return "I can help with study planning, concept explanations, or locating resources. Try asking about your next step, your current progress, or recommended texts.";
  }, [milestones, resources, userProgress, nextMilestone]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = { type: "user", content: trimmedInput };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const recentMessages = updatedMessages.slice(-10);
      const { data, error } = await supabase.functions.invoke("study-ai-chat", {
        body: {
          messages: recentMessages,
          context: buildContext(),
        },
      });

      if (error) throw new Error(error.message);

      const reply = data?.reply;
      if (!reply) throw new Error("Empty response");

      setMessages((prev) => [...prev, {
        type: "bot",
        content: reply,
        sources: normalizeSources(data?.sources),
        provider: data?.provider,
        model: data?.model,
      }]);
    } catch (error) {
      console.warn("AI chat error, using fallback:", error);
      setMessages((prev) => [...prev, { type: "bot", content: getLocalFallback(trimmedInput), sources: [] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <section className={styles.root}>
      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setActiveTab("path")}
          className={activeTab === "path" ? styles.tabButton.active : styles.tabButton.idle}
        >
          <Map size={14} />
          Study Path
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={activeTab === "chat" ? styles.tabButton.active : styles.tabButton.idle}
        >
          <MessageSquare size={14} />
          AI Assistant
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "path" ? (
          <div className={styles.pathView}>
            <div className={styles.insightCard}>
              <span className={styles.insightBadge}>
                <Sparkles size={12} />
                AI Insight
              </span>
              <p className={styles.insightText}>{recommendationText}</p>
            </div>

            <div className={styles.pathList}>
              <div className={styles.pathLine} aria-hidden="true" />
              {pathSteps.length === 0 ? (
                <p className={emptyState}>No study path steps are available yet.</p>
              ) : (
                pathSteps.map((item) => (
                  <div key={item.step} className={styles.pathItem}>
                    <div className={styles.pathMarker[item.completed ? "completed" : "pending"]}>
                      {item.completed ? <CheckCircle2 size={12} /> : item.step}
                    </div>

                    <div className={`${styles.pathCard} ${styles.pathCardState[item.completed ? "completed" : "pending"]}`}>
                      <div className={styles.pathHeader}>
                        <h3 className={styles.pathTitle}>{item.title}</h3>
                        <span className={styles.pathSubtitle}>{item.subtitle}</span>
                      </div>
                      <p className={styles.pathText}>{item.suggestion}</p>
                      <div className={styles.resourceMeta}>
                        <item.IconComp size={14} />
                        <span>{item.completed ? "Completed archive entry" : "Recommended resource"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className={styles.chatView}>
            <div className={styles.messages}>
              {messages.map((message, index) => (
                <div key={`${message.type}-${index}`} className={styles.messageRow[message.type]}>
                  <div className={styles.messageCluster[message.type]}>
                    {message.type === "bot" ? (
                      <>
                        <div className={styles.avatar.bot}>
                          <Bot size={16} />
                        </div>
                        <div className={styles.messageBody}>
                          <div className={styles.bubble.bot}>{message.content}</div>
                          <SourceChips sources={message.sources} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.bubble.user}>{message.content}</div>
                        <div className={styles.avatar.user}>
                          <User size={16} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className={styles.messageRow.bot}>
                  <div className={styles.messageCluster.bot}>
                    <div className={styles.avatar.bot}>
                      <Bot size={16} />
                    </div>
                    <div className={styles.typingBubble}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className={styles.composer}>
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the next milestone, a concept, or a recommended text..."
                className={styles.composerInput}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className={styles.sendButton}
              >
                <Send size={14} />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StudyPathAI;
