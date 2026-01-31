# PLAN: Minimalist AI Video SaaS (Zen Portal)

## 1. Overview
A "Zen" minimalist, high-tech SaaS for generating videos from text.
**Key Features:**
- **Aesthetics:** "Glass Portal" login, immersive "Deep Matte" creation flow.
- **Access:** Social Logins (Google, Github, Apple, FB) via Supabase.
- **Core Loop:** Users get 30s free generation. System queues job with KIE AI.
- **Architecture:** Serverless Google Cloud (Cloud Run + Functions) + Supabase.

## 2. Cost & Hosting Analysis (Google Cloud vs Vercel)

### Why Google Cloud Run?
- **Unified Stack:** Keep Frontend (Next.js) and Backend (Functions / Listeners) in the same VPC/IAM context.
- **Cost Scaling:**
    - **Frontend:** Pay-per-use. Scales to zero when no one is visiting.
    - **Backend:** Cloud Run Functions are extremely cheap for event-driven logic (webhooks).
    - **Free Tier:** GCP offers ~180,000 vCPU-seconds/month free for Cloud Run, which is huge for an MVP.
- **Performance:** deploying the Next.js container to the same region as the DB and storage minimizes latency.

### Cost Breakdown (Estimates)
| Component | Service | Cost Model |
|-----------|---------|------------|
| **Frontend** | Cloud Run Service | Free tier covers MVP. Then ~$0.00002400/vCPU-s |
| **Backend Logic** | Cloud Run Functions | ~$0/mo (Free tier 2M invocations) |
| **Database/Auth** | Supabase | Free Tier (500MB DB, 50k MAU) |
| **AI Generation** | KIE AI | Pay-per-generation (User's choice) |
| **Queuing** | Cloud Pub/Sub | ~$0/mo (Free tier 10GB message data) |
| **Storage** | Cloud Storage (GCS) | Standard class ~$0.02/GB (Video storage) |

## 3. Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Framer Motion (Animations).
- **Auth & DB:** Supabase (PostgreSQL + GoTrue Auth).
- **Backend:** Google Cloud Run Functions (Node.js 20+).
- **Video AI:** KIE AI API (using Callback/Webhook pattern).
- **Storage:** Google Cloud Storage (Bucket: `videosaas-user-content`).

## 4. Implementation Stages

### Phase 1: Foundation
- [ ] Initialize Next.js Project with Tailwind & Lucide React.
- [ ] Configure Supabase (Create Project, Tables: `users`, `generations`, `credits`).
- [ ] Configure GCP Project (Enable APIs: Cloud Run, Cloud Build, Artifact Registry, GCS).
- [ ] Setup `docs/` and architecture guide.

### Phase 2: User Interface (The "Zen" Look)
- [ ] **Login Screen:** Minimalist 3D background (Spline or CSS/Video loop) + Glassmorphism card.
- [ ] **Dashboard:** Sidebar-less initial view. "Prompt Center" focused design.
- [ ] **History:** Slide-out drawer for previous videos.

### Phase 3: The Core Loop (Async)
- [ ] **Frontend:** API Route `/api/generate` -> Validates credits -> Push to Cloud Pub/Sub or Call Function.
- [ ] **Backend (Function 1):** `start-generation`
    - Triggered by Frontend.
    - Calls KIE AI API with `callback_url`.
    - Creates `generation` record in Supabase (Status: `PENDING`).
- [ ] **Backend (Function 2):** `webhook-handler`
    - Receives POST from KIE AI.
    - Validates signature.
    - Updates Supabase record (Status: `COMPLETED`, adds video URL).
    - Optional: Downloads video from KIE -> Uploads to GCS (Own the asset).

### Phase 4: Polish & Limits
- [ ] **Credit System:** Decrement 30s credit on successful generation.
- [ ] **Realtime:** Next.js listens to Supabase `generations` table changes to auto-update UI when video is ready.
- [ ] **Deployment:** GitHub Actions pipeline to deploy container to Cloud Run.

## 5. Verification Plan
### Automated Tests
- **Unit:** Jest/Vitest for `credit-calculation` logic.
- **E2E:** Playwright.
    - Test 1: User can login (mocked).
    - Test 2: User sees prompt input.
    - Test 3: Webhook payload updates status in UI.

### Manual Checks
1.  **Auth:** Verify all social providers redirect correctly.
2.  **Visuals:** Check "Zen" aesthetic on Mobile vs Desktop.
3.  **Flow:** Run a generation, check Supabase DB for status change from `PENDING` -> `COMPLETED`.
