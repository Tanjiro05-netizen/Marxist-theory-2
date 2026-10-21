# 🧠 Knowledge Base Recommendation Algorithm — Master Design Document

> *"Quora meets Zhihu, built for Marxist theory discourse."*
> This document describes the full algorithm from scratch. No prior knowledge of the platform is assumed.

---

## 1. Platform Context & Goals

The Knowledge Base is a community Q&A platform where:
- **Users ask questions** about Marxist theory, political economy, history, science, etc.
- **Certified users** (Professionals, Academics, Verified Students) post answers
- **All content is moderated** before appearing (status: `approved` / `pending` / `rejected`)
- The feed should feel **intelligent, not chronological** — rewarding quality, expertise, and personal relevance

**Primary goals of the algorithm:**
1. Surface the *most useful* content for each individual user
2. Reward *quality and expertise* over raw activity
3. Build *long-term interest profiles* passively from user behaviour
4. Prevent low-quality, spammy, or repetitive content from dominating the feed
5. Ensure new/niche content gets a *fair chance* to be discovered (avoid rich-get-richer monopolies)

---

## 2. The Two-Phase Architecture (Candidate → Ranking)

Every major recommendation system (Zhihu, YouTube, TikTok, Twitter) uses a **two-phase funnel**. We do the same.

```
ALL APPROVED CONTENT
        │
        ▼
┌──────────────────────┐
│  PHASE 1: RETRIEVAL  │  ← Fast, broad, cheap
│  Candidate Pool      │  ← ~200–500 items filtered
│  (Interest Match)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  PHASE 2: RANKING    │  ← Slower, expensive, personalised
│  Score each item     │  ← Top 20–50 surface to user
│  (Quality × Rel.)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  PHASE 3: DIVERSITY  │  ← Anti-echo-chamber layer
│  Filter & Inject     │  ← Ensure topic spread, freshness
└──────────┬───────────┘
           │
           ▼
      USER'S FEED
```

---

## 3. Phase 1 — Candidate Retrieval

The goal is to quickly narrow **all approved questions** down to a manageable candidate pool (~200–500 items) for the ranker. We use **four retrieval channels** mixed together:

### Channel A: Topic Interest Graph
Pull questions from topics the user follows or has historically engaged with.

```
candidate_pool ← questions WHERE topic IN user.followed_topics
                 UNION
                 questions WHERE topic IN user.interest_profile.top_topics
```

*Weight:* Topics the user actively follows score 1.0. Inferred interest topics (from view history) score 0.6.

### Channel B: Social Graph
Pull questions from authors the user follows (if a follow-author feature exists), or questions that users *with similar interests* have upvoted recently.

```
candidate_pool ← questions WHERE author IN user.following
                 UNION  
                 questions upvoted_by users WHERE cosine_similarity(user.interest_vector, other.interest_vector) > 0.7
```

### Channel C: Trending / Hot Pool
A global trending pool, refreshed every hour, is always included. This prevents the feed from becoming a pure filter bubble.

```
candidate_pool ← top 100 trending questions (see Section 6 for trending score)
```

### Channel D: Freshness Injection
New questions (< 48 hours old) from approved topics that have *not yet* been widely distributed get force-injected into every candidate pool. This is the Zhihu/Xiaohongshu *"initial traffic test pool"* concept — every new piece of approved content gets a guaranteed first audience of N users.

```
candidate_pool ← questions WHERE created_at > now() - 48h
                 AND impression_count < 500
                 AND status = 'approved'
                 LIMIT 20
```

---

## 4. Phase 2 — The Ranking Score

Each candidate question gets a **composite score `S`**. The highest-scoring questions reach the top of the feed.

### 4.1 The Master Scoring Formula

```
S(q, u) = Quality(q) × Relevance(q, u) × Freshness(q) × AuthorTrust(q) × (1 - Fatigue(q, u))
```

Each factor is a multiplier between 0.0 and 1.0 (or slightly above 1.0 for boosts). We go through each component:

---

### 4.2 `Quality(q)` — Content Quality Score

This measures the *intrinsic quality* of a question and its answers, independent of the viewer.

```
Quality(q) = (
    0.35 × vote_score(q)
  + 0.25 × answer_quality(q)
  + 0.20 × engagement_rate(q)
  + 0.10 × save_rate(q)
  + 0.10 × view_depth(q)
)
```

**`vote_score(q)`** — Wilson Score lower bound (not raw count). This penalises questions with few votes or bad ratios.

```
wilson_score = (upvotes + 1.9208) / (upvotes + downvotes) 
               - 1.96 * sqrt((upvotes * downvotes / (upvotes + downvotes) + 0.9604) / (upvotes + downvotes))
               / (1 + 3.8416 / (upvotes + downvotes))
```

Why Wilson? A question with 1 upvote/0 downvotes should NOT outrank one with 100/10. Wilson accounts for statistical confidence.

**`answer_quality(q)`** — Weighted by who answered:
```
answer_quality = sum over answers of:
    base_answer_score * author_trust_multiplier(answer.author)
```
Where `author_trust_multiplier` = 1.8 if `is_certified`, 1.0 otherwise. A single expert answer massively lifts a question.

**`engagement_rate(q)`** — (comments + answers + shares) / impressions. Normalised 0–1.

**`save_rate(q)`** — favorites / views. Saves are a strong long-term quality signal (Xiaohongshu uses this heavily — saves indicate "I'll return to this").

**`view_depth(q)`** — Average % of question page scrolled. Requires frontend instrumentation. Questions people read in full score higher than ones they bounce from. *This is a future-phase signal.*

---

### 4.3 `Relevance(q, u)` — Personal Relevance Score

This is the *personalisation* layer. It compares the question's topic/content profile to the user's **Interest Vector** (see Section 5).

```
Relevance(q, u) = cosine_similarity(question.topic_vector, user.interest_vector)
                + 0.3 × topic_follow_bonus(q, u)
                + 0.2 × author_follow_bonus(q, u)
```

- **`topic_follow_bonus`** = 0.4 extra if question is in a topic the user explicitly follows
- **`author_follow_bonus`** = 0.2 extra if the question was asked by a user the current user follows
- Cold start (new user with no history): `Relevance = 0.5` flat for all questions (feeds into trending/quality only)

---

### 4.4 `Freshness(q)` — Time Decay

Inspired by Hacker News and Reddit's time decay, but tuned for a *knowledge* platform (vs. news). Knowledge ages slower, so we use a gentle decay curve.

```
Freshness(q) = 1 / (1 + decay_rate × age_in_hours ^ gravity)
```

Default constants:
- `decay_rate = 0.005`
- `gravity = 1.2`

At **0 hours** → Freshness = 1.0
At **24 hours** → Freshness ≈ 0.89
At **72 hours** → Freshness ≈ 0.72
At **1 week** → Freshness ≈ 0.55
At **1 month** → Freshness ≈ 0.35
At **6 months** → Freshness ≈ 0.12

**Exception — "Evergreen Boost":** High-quality questions (Quality > 0.8) that are > 30 days old get a floor: `Freshness_floor = 0.30`. This prevents classic theory questions from disappearing entirely — Zhihu calls these 优质老内容 (*quality archived content*).

---

### 4.5 `AuthorTrust(q)` — Verified User Boost ⭐

This is the most politically important part of the algorithm for this platform. Certified comrades (professionals, academics, verified students) are boosted.

```
AuthorTrust(q) = base + sum of active role bonuses
```

| User Role | `AuthorTrust` multiplier |
|---|---|
| Unverified regular user | 1.00 |
| Verified Student | 1.15 |
| Community Contributor (active, high vote ratio) | 1.20 |
| Certified Academic / Professional | 1.50 |
| Platform Admin / Moderator | 1.30 |
| Banned / flagged | 0.10 |

**Important nuance:** This multiplier applies to the *question's ranking*, not the answer's ranking in isolation. A question asked by a certified academic gets a 1.5× boost in the feed. Their *answers* on other questions also get displayed first within the question page (separate sort logic).

**How trust is earned (the Zhihu model):**
- Submit credentials → admin verifies → `is_certified = true` and role tag set
- Engagement quality over time: if a user consistently gets high vote ratios (upvotes / total votes > 75%) over 50+ interactions, they earn a "Rising Contributor" internal flag that slightly boosts their content

---

### 4.6 `Fatigue(q, u)` — Seen-It Filter

Content the user has *already seen* or *already interacted with* should be suppressed.

```
Fatigue(q, u) = 
    1.0   if question.id IN user.seen_question_ids  (hide completely)
    0.9   if question.topic IN user.last_3_topics_seen (same topic fatigue)
    0.0   otherwise
```

This means:
- Already-viewed questions are essentially removed (score approaches 0)
- If the user just saw 3 questions about *Political Economy*, the 4th gets penalised to inject topic diversity

---

## 5. The Interest Vector — Building the User Profile Over Time

This is the passive learning layer. Every interaction a user performs updates a lightweight **interest profile** stored per user. No explicit preferences needed — it's inferred.

### 5.1 What we track (the raw signals)

| Signal | Event | Weight |
|---|---|---|
| View question | User opens a question page | +0.3 |
| Read to bottom | User scrolls > 80% of page | +0.6 |
| Upvote question | | +1.0 |
| Save/Favorite | | +1.5 |
| Follow topic | Explicit follow | +2.0 |
| Ask question in topic | | +1.5 |
| Submit answer in topic | | +1.8 |
| Search query | Search text contains topic keywords | +0.4 |
| Skip question | User sees it, doesn't click | −0.2 |
| Downvote | | −0.5 |
| Unfollow topic | | −2.0 |

### 5.2 The Interest Vector Structure

```json
{
  "user_id": "uuid",
  "topic_weights": {
    "marxist-economics": 0.87,
    "historical-materialism": 0.72,
    "imperialism": 0.55,
    "philosophy": 0.44,
    "soviet-history": 0.31
  },
  "keyword_weights": {
    "dialectics": 0.6,
    "mode-of-production": 0.5,
    "surplus-value": 0.8
  },
  "preferred_answer_depth": "detailed",
  "preferred_authors": ["user_uuid_1", "user_uuid_2"],
  "last_updated": "2026-04-13T00:00:00Z"
}
```

### 5.3 Decay of old interests (the forgetting curve)

User interests are not permanent. They decay weekly to prevent a stale profile dominating forever.

```
new_weight = old_weight × 0.95   (applied every 7 days per topic)
```

This means:
- A topic seen once 6 months ago contributes almost nothing (0.95^26 ≈ 0.27×)
- A topic seen weekly stays near its peak

---

## 6. The Trending/Hot Score

The "Hot" feed tab uses a **separate trending score** that is *time-windowed* (last 24h / 7 days). This mirrors Zhihu's 热榜 (Hot List).

```
TrendingScore(q, window) =
    (upvotes_in_window × 3)
  + (new_answers_in_window × 5)
  + (new_favorites_in_window × 4)
  + (new_views_in_window × 1)
  + (new_comments_in_window × 2)
  / (age_of_question_hours ^ 1.5 + 2)
```

The denominator (time decay) means a burst of engagement on a *new* question beats a slow drip on an old one. The `+2` prevents division by zero for brand-new content.

**Trending is global and non-personalised** (same for all users). It's the discovery mechanism, not the personalisation one.

---

## 7. The Answer Ranking Algorithm (Within a Question Page)

Within a single question, answers are sorted by a separate **Answer Score**:

```
AnswerScore(a) =
    wilson_score(a.upvotes, a.downvotes)
  × author_trust_multiplier(a.author)
  × (1 + 0.5 × a.is_accepted)
  × (1 + 0.3 × a.is_expert_answer)
  × freshness_mild(a.created_at)
```

- Accepted answers always appear first (enforced by sort order, not just score)
- Certified/expert answers float to the top among non-accepted answers
- Mild freshness decay: new answers from credible authors can challenge old ones

---

## 8. The Cold Start Problem

**New users** have no interest history. **New content** has no engagement history. Handle them separately:

### New User Cold Start
1. **Onboarding topic picker** — After signup, show 8–12 topic bubbles. User picks ≥ 3. These seed the interest vector at weight `2.0`
2. **Fallback to global hot feed** — Until the user has ≥ 20 signals, show the global trending feed
3. **Fast learning** — First 10 interactions are weighted 3× heavier to build the profile quickly

### New Content Cold Start (the Zhihu/Xiaohongshu "Traffic Pool" model)
Every new approved question enters **Traffic Pool 0** automatically:

```
Pool 0: 200 impressions → measure CTR + engagement rate
  → If engagement_rate > threshold_1: promote to Pool 1 (2,000 impressions)
  → If engagement_rate < threshold_0: suppress (quality flag)

Pool 1: 2,000 impressions → measure again
  → If engagement_rate > threshold_2: promote to Pool 2 (20,000 impressions)
  → etc.
```

This ensures **every question gets a fair first audience** regardless of who asked it, while organically surfacing high-quality content to more people.

---

## 9. Anti-Gaming & Quality Safeguards

### Vote Ring Detection
- Track velocity: if a question gets > 10 upvotes within 5 minutes from users who have never interacted before, flag for review
- Score suspicious engagement at 0.1× weight (soft penalty, not deletion)

### Engagement Authenticity
- Bot/inactive accounts (0 questions/answers, created < 7 days ago) have their votes weighted at 0.2× the normal rate
- Only `is_certified` or accounts > 30 days old with > 5 interactions cast "full weight" votes

### Downvote Dampener
- A flood of sudden downvotes on a legitimate answer triggers a review flag (prevents brigading)
- Downvotes by users who have never engaged with this topic are weighted 0.3×

### Diversity Enforcement (Anti-Filter-Bubble)
Hard rules applied *after* scoring:
1. **No topic repeat in top 3** — The top 3 feed items must be from ≥ 2 different topics
2. **Freshness injection** — 1 in every 10 feed positions is reserved for new content (< 48h), regardless of score
3. **Author repeat cap** — The same author's content cannot appear more than twice in any 20-item feed slice

---

## 10. Database Schema Additions Needed

To implement this, the following new tables/columns are required:

```sql
-- User interest profile (updated incrementally)
CREATE TABLE user_interest_profiles (
    user_id          uuid REFERENCES profiles(id) PRIMARY KEY,
    topic_weights    jsonb DEFAULT '{}',
    keyword_weights  jsonb DEFAULT '{}',
    last_updated     timestamptz DEFAULT now()
);

-- Per-question impression tracking (for traffic pools + CTR)
ALTER TABLE knowledge_questions ADD COLUMN
    impression_count integer DEFAULT 0,
    click_count      integer DEFAULT 0,
    save_count       integer DEFAULT 0,
    traffic_pool     smallint DEFAULT 0;  -- 0,1,2,3

-- Interaction event log (raw signals for interest vector updates)
CREATE TABLE knowledge_interactions (
    id            bigserial PRIMARY KEY,
    user_id       uuid REFERENCES profiles(id),
    question_id   uuid REFERENCES knowledge_questions(id),
    event_type    text,  -- 'view','read_depth','upvote','save','skip','search'
    weight        float  DEFAULT 1.0,
    topic_id      uuid,
    created_at    timestamptz DEFAULT now()
);

-- Pre-computed feed scores cache (refreshed every N minutes)
CREATE TABLE knowledge_feed_cache (
    user_id      uuid REFERENCES profiles(id),
    question_id  uuid REFERENCES knowledge_questions(id),
    score        float,
    bucket       text,  -- 'recommended', 'hot', 'following'
    computed_at  timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, question_id, bucket)
);
```

---

## 11. Implementation Phases

### Phase 1 — Foundation (implement now, no ML needed)
- **Trending score** — Replace `order by created_at` with the trending formula above on the "Hot" tab
- **Wilson score** on upvote counts everywhere
- **AuthorTrust multiplier** — `is_certified` gets 1.5× in ranking (pure SQL `CASE WHEN`)
- **Traffic Pool 0** — Inject 3–5 new questions (<48h) into every user's feed regardless of score

### Phase 2 — Interest Graph (passive profile building)
- Log `knowledge_interactions` on every page view, upvote, save
- Build a **nightly job** (Supabase Edge Function or cron) that reads interactions and updates `user_interest_profiles`
- Use `topic_weights` to filter candidate pool in getQuestions()

### Phase 3 — Personalised Ranking (full scoring)
- Compute `S(q, u)` per user either:
  - **Real-time**: on feed load (fast for small user bases, up to ~10k users)
  - **Pre-computed cache**: a job runs every 15 minutes and writes top-50 scored items per user to `knowledge_feed_cache`
- The feed reads from the cache, falls back to trending if cache is stale/empty

### Phase 4 — Collaborative Filtering (ML, long-term)
- Find users with similar `topic_weights` vectors (cosine similarity)
- Surface questions highly-rated by similar users that the current user hasn't seen
- This is the classic "people like you also read…" signal

---

## 12. Key Metrics to Track Algorithm Health

| Metric | Good | Danger sign |
|---|---|---|
| Feed CTR (click/impression) | > 8% | < 3% |
| Read depth per question visit | > 60% scroll | < 25% |
| Save rate on shown questions | > 2% | < 0.3% |
| Topic diversity in top-10 feed | ≥ 4 distinct topics | < 2 topics |
| New question first-48h impressions | ≥ 200 | < 50 |
| Certified author answer rate | > 40% of answered questions | < 15% |
| Interest vector staleness | < 7 days avg age | > 30 days |

---

## 13. Summary — TL;DR for any developer

> **The feed is a product of Quality × Relevance × Freshness × Trust.**
> 
> Every new question gets a guaranteed first audience (Pool 0). Certified users' content floats up via the AuthorTrust multiplier. Each user's feed diverges over time based on their interaction history (interest vector). The "Hot" tab is a global trending list separate from personalisation. Anti-gaming rules prevent vote manipulation. The whole system needs only SQL + a lightweight background job — no ML framework required for Phases 1–3.
