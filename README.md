
# Nexus - AI-Powered Social Community Moderator & Content Curator
> **Nebula9.ai Full Stack GenAI Internship Assignment — Project #8**

An intelligent community moderation platform that uses *GEMINI* to automatically analyze, score, and action user-submitted content — with a full moderator dashboard, role-based access control, audit logging, and analytics.



---


### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@moderator.ai | admin123 |
| Moderator | mod@moderator.ai | mod123 |
| User | sarah@example.copm | test |

---

## Features

### Core (Mandatory Requirements)

- **AI Text Moderation** — gemini-2.5-flash analyzes every post for hate speech, harassment, spam, misinformation, explicit content, and violence with per-category confidence scores (0–1)
- **AI Image Moderation** — gemini-2.5-flash scans image attachments for policy violations; scores are merged with text analysis (worst score wins)
- **Auto-moderation Pipeline** — Posts above configurable thresholds are actioned without human review:
  - `aiScore ≥ 0.9` → auto-removed
  - `aiScore ≥ 0.7` → auto-flagged for review
  - No violation detected → auto-approved
- **Moderator Review Queue** — Prioritized queue sorted by AI toxicity score; inline actions: Approve, Flag, Remove, Warn User, Ban User
- **Bulk Moderation** — Select multiple posts, apply one action across all of them
- **Role-Based Access Control (RBAC)** — Three roles enforced at both route and UI level:
  - `USER` — can post and report
  - `MODERATOR` — can access queue, analytics, history
  - `ADMIN` — full access including user management and community settings
- **JWT Authentication** — Stateless auth with 7-day token expiry
- **OAuth 2.0** — Google and GitHub login via Passport.js
- **Community-specific Rules** — Each community has custom rules passed as context to the AI, enabling context-aware moderation decisions
- **User Trust Scoring** — Each user has a dynamic trust score (0–100); warnings deduct 10 points, bans zero it out
- **Analytics Dashboard** — Live stats, 7-day post trend (area chart), violation type breakdown (pie chart), per-community health scores
- **User Reporting** — Users can report posts; 3+ reports on a post triggers an automatic flag



## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                       React Frontend                         │
│                                                              │
│   Login → Dashboard → Mod Queue → Posts → Analytics         │
│                 (TanStack Query — polling + cache)           │
└────────────────────────┬─────────────────────────────────────┘
                         │  REST API over HTTP (Bearer JWT)
┌────────────────────────▼─────────────────────────────────────┐
│                  Node.js / Express Backend                    │
│                                                              │
│   Routes → Controllers → Services → Prisma ORM              │
│                                                              │
│   ┌─────────────────────┐    ┌──────────────────────────┐   │
│   │     AI Service      │    │   Auth (JWT + OAuth)     │   │
│   │  gemini-2.5-flash  (text)     │    │   Passport Google/GitHub │   │
│   │  gemini-2.5-flash  (vision)   │    └──────────────────────────┘   │
│   └─────────────────────┘                                    │
└────────────────────────┬─────────────────────────────────────┘
                         │  Prisma ORM
┌────────────────────────▼─────────────────────────────────────┐
│                      PostgreSQL                               │
│                                                              │
│   Users · Communities · Posts · ModerationLogs · Reports    │
└──────────────────────────────────────────────────────────────┘
```

### AI Moderation Pipeline

```
User submits POST /api/posts
          │
          ▼
  analyzeTextContent()   ←──── gemini-2.5-flash (structured JSON output)
          │
          ├─ imageUrl present?
          │       └──── analyzeImageContent()  ←── gemini-2.5-flash
          │                     │
          │              merge scores (take max toxicity)
          │
          ▼
  toxicityScore ≥ 0.90  →  status = REMOVED  (auto)
  toxicityScore ≥ 0.70  →  status = FLAGGED  (queue for review)
  no violation found    →  status = APPROVED (auto)
  else                  →  status = PENDING  (human review)
          │
          ▼
  Post + full AI analysis JSON saved to DB
  Response returned to client with score + action taken
```

### Fail-Safe Behavior

If the OpenAI API call fails for any reason, the post is saved with `status = PENDING` and routed to the human review queue. The system **never auto-approves on AI failure** — it always falls back to human review.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Fast builds, SPA routing |
| Styling | Tailwind CSS | Utility-first, easy dark theme |
| Data fetching | TanStack Query v5 | Auto-polling, caching, mutation invalidation |
| Charts | Recharts | Lightweight, composable chart primitives |
| Backend | Node.js + Express | Matches spec, rapid development |
| ORM | Prisma | Type-safe queries, great migration tooling |
| Database | PostgreSQL | Relational integrity for audit logs + joins |
| AI | gemini-2.5-flash | Free text + image processing  |
| Auth | JWT + Passport.js | Stateless, easy to scale |
| Containerization | Docker + Compose | Reproducible environments |
| Deployment | Render + Vercel | Generous free tiers, zero-config CI/CD |
| Logging | Winston | Structured JSON logs, file + console |

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally (or use the Docker setup below)
- An OpenAI API key ([platform.openai.com](https://platform.openai.com))

### Step 1 — Clone the repository

```bash
git clone https://github.com/Rahulv1130/Nexis.git
cd Nexis
```

### Step 2 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### Step 3 — Configure environment variables


### Step 4 — Set up the database

```bash
cd backend

# Create tables via Prisma migration
npx prisma migrate dev --name init
npx prisma generate
```


### Step 5 — Start the development servers

```bash
# Terminal 1 — Backend (runs on port 5000)
cd backend
node server.js

# Terminal 2 — Frontend (runs on port 3000)
cd frontend
npm run dev
```


---

## API Reference

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register with email + password |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user profile |
| GET | `/api/auth/google` | Public | Redirect to Google OAuth |
| GET | `/api/auth/github` | Public | Redirect to GitHub OAuth |

### Posts

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/posts` | Auth | Submit post — triggers AI moderation |
| GET | `/api/posts` | Auth | List posts (Users see APPROVED only) |
| GET | `/api/posts/:id` | Auth | Get single post with full analysis |
| POST | `/api/posts/:id/report` | Auth | Report a post |

### Moderation

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/moderation/queue` | Mod+ | Flagged/pending posts sorted by score |
| POST | `/api/moderation/:id/action` | Mod+ | Approve / Flag / Remove / Warn / Ban |
| POST | `/api/moderation/bulk` | Mod+ | Bulk action on array of post IDs |
| GET | `/api/moderation/history` | Mod+ | Full audit log of all moderation actions |

### Analytics

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/analytics/dashboard` | Mod+ | Stats, trends, violation breakdown |
| GET | `/api/analytics/community-health` | Mod+ | Health score per community |

### Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | List all users with search/filter |
| PATCH | `/api/users/:id/role` | Admin | Promote/demote user role |
| PATCH | `/api/users/:id/unban` | Admin | Lift a ban |

### Communities

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/communities` | Auth | List all communities |
| POST | `/api/communities` | Admin | Create community with custom rules |
| PATCH | `/api/communities/:id` | Admin | Update name, description, or rules |

---


## Assumptions & Implementation Details

### Authentication
- Email/password auth works fully without OAuth credentials — OAuth is optional and purely additive
- OAuth tokens are passed back to the frontend via redirect query param (`?token=...`) and stored in `localStorage`
- JWT expiry is set to 7 days; there is no refresh token mechanism (acceptable for a demo scope)

### AI Moderation
- The `AUTO_FLAG_THRESHOLD` (0.7) and `AUTO_REMOVE_THRESHOLD` (0.9) are configurable via environment variables — different communities may need different sensitivity

- If both text and image are present, the scores are merged by taking the **maximum** toxicity score — a clean text post with a violating image is still removed

### Real-time Updates
- The moderation queue auto-refreshes every 15 seconds via TanStack Query's `refetchInterval`; the dashboard auto-refreshes every 30 seconds
- This polling approach was chosen over WebSockets to keep the implementation within the 4-day scope — it is functionally equivalent for the queue sizes expected in this demo

### Image Uploads
- Images are first uploaded to cloudinary then the received url is stored in DB

### User Trust Score
- Starts at 50 for all new users
- Each warning issued by a moderator deducts 10 points
- Being banned zeroes the score
- Future work: auto-increment score for consistently approved posts



## What I'd Add With More Time

- **WebSocket-based real-time alerts** — push notifications to moderators the moment a high-score post is submitted, instead of polling
- **Appeal system** — users can contest a removal; AI re-evaluates with additional context; moderator makes final call
- **Fine-tuned moderation model** — train a smaller, faster model on community-specific labeled data to reduce false positives over time
- **Semantic duplicate detection** — embed posts and flag near-duplicates as spam before they reach the queue
- **Moderator workload distribution** — round-robin queue assignment across online moderators to avoid bottlenecks
- **Email notifications** — nodemailer integration to notify users of bans, warnings, and appeal outcomes
- **A/B threshold testing** — track false positive/negative rates at different `AUTO_FLAG_THRESHOLD` values to tune accuracy empirically

---

---

*Built by [Rahul Verma] for the Nebula9.ai Full Stack GenAI Developer Internship — May 2026*
