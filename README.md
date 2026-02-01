# Didi Video Dreamer

A minimalist AI-powered video generation platform. Users describe a video idea (via text or voice), the system generates a script using Google Gemini, and creates a video via KIE AI — all through a sleek glassmorphism interface.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Voice Input  │───▶│  Text Prompt │───▶│   Generate   │      │
│  │ (Speech API) │    │              │    │    Button    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Cloud Run)                 │
│                                                                 │
│  /api/generate ──────▶ Proxies to Cloud Function               │
│  /api/status/[id] ───▶ Polls video completion status           │
│  /api/generations ───▶ Lists user's video history              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              start-generation (Cloud Function)                  │
│                                                                 │
│  1. Verify Firebase ID token                                    │
│  2. Check credit balance                                        │
│  3. Stream script from Gemini ─────▶ NDJSON to browser         │
│  4. Submit to KIE AI                                            │
│  5. Store in Firestore (status: waiting)                        │
│  6. Deduct credits                                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    KIE AI (External Service)                    │
│                                                                 │
│  Generates video asynchronously (30-60 seconds)                 │
│  Calls webhook when complete                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              webhook-handler (Cloud Function)                   │
│                                                                 │
│  1. Receive callback from KIE AI                                │
│  2. Extract video URL from response                             │
│  3. Update Firestore document with video_url + status           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Firestore                                │
│                                                                 │
│  credits/{uid}        ──▶ User's remaining seconds              │
│  generations/{taskId} ──▶ Video generation records              │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Google OAuth** login via Firebase Authentication
- **Voice input** — speak your video idea using browser Speech Recognition API
- **Streaming script generation** — watch the AI script appear in real-time via NDJSON streaming
- **Async video generation** via KIE AI with webhook-based completion
- **Duration selection** — choose 6s or 10s videos
- **Aspect ratio selection** — Portrait (9:16) for Instagram/TikTok or Landscape (16:9) for YouTube
- **Credit system** — 70 free seconds per account, deducted per generation
- **Video Vault** — slide-out drawer to browse and replay generated videos
- **Glassmorphism UI** — dark theme with animated gradient orbs, backdrop blur, Framer Motion animations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Google Cloud Functions Gen2 (Node.js 20) |
| Database | Google Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| AI | Google Vertex AI (Gemini 2.5 Flash), KIE AI (grok-imagine/image-to-video) |
| Hosting | Google Cloud Run (containerized) |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions (OIDC federation) |

## Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Geist fonts, metadata)
│   ├── page.tsx                  # Main dashboard with generation UI
│   ├── login/page.tsx            # Google OAuth login page
│   ├── globals.css               # Tailwind + glassmorphism styles
│   └── api/
│       ├── generate/route.ts     # Proxy to start-generation function
│       ├── status/[taskId]/route.ts  # Poll video completion status
│       └── generations/route.ts  # List user's generations
├── components/
│   ├── GlassCard.tsx             # Animated glass card component
│   ├── VideoDrawer.tsx           # Video vault slide-out panel
│   └── StreamingText.tsx         # Markdown renderer with typing cursor
├── lib/
│   └── firebase/client.ts        # Firebase SDK initialization
├── types/
│   └── speech.d.ts               # TypeScript declarations for Web Speech API
├── functions/
│   ├── start-generation/         # Main generation function
│   │   ├── index.js              # Validates auth, streams Gemini, calls KIE
│   │   └── package.json
│   ├── webhook-handler/          # KIE AI callback handler
│   │   ├── index.js              # Updates Firestore with video URL
│   │   └── package.json
│   ├── check-status/             # Video status checker
│   │   ├── index.js
│   │   └── package.json
│   └── list-generations/         # User generations list
│       ├── index.js
│       └── package.json
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Provider config, API enablement
│   ├── frontend.tf               # Cloud Run service
│   ├── functions.tf              # Cloud Functions deployment
│   ├── firestore.tf              # Database + security rules + indexes
│   ├── oidc.tf                   # GitHub Actions OIDC federation
│   └── variables.tf              # Input variables
├── .github/workflows/
│   └── deploy.yml                # CI/CD pipeline (frontend only)
├── Dockerfile                    # Multi-stage build (node:20-alpine)
└── public/
    └── favicon.svg               # Gradient play button icon
```

## User Flow

1. **Sign in** with Google on `/login`
2. **Enter prompt** by typing or using voice input (microphone button)
3. **Select options** — duration (6s/10s) and aspect ratio (9:16/16:9)
4. **Click Generate** — request sent to `/api/generate`
5. **Watch script stream** — Gemini's response appears character by character
6. **Wait for video** — UI shows "Generating video... Usually takes 30-60 seconds"
7. **Video appears** — webhook updates Firestore, polling detects completion
8. **Browse Vault** — view all past generations in the slide-out drawer

## Data Model (Firestore)

### `credits` collection

| Field | Type | Description |
|-------|------|-------------|
| `seconds_remaining` | number | Available credits (default: 70) |
| `updated_at` | timestamp | Last modification time |

Document ID = Firebase UID

### `generations` collection

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Firebase UID |
| `original_prompt` | string | User's input text |
| `generated_script` | string | Gemini-enhanced script |
| `status` | string | `waiting` / `success` / `fail` |
| `kie_task_id` | string | KIE AI task ID |
| `video_url` | string | Final video URL (set by webhook) |
| `fail_message` | string | Error message if failed |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

Document ID = KIE AI task ID

**Composite Index:** `user_id` ASC + `created_at` DESC (for Vault queries)

## Getting Started

### Prerequisites

- Node.js 20+
- Google Cloud project with Firestore, Cloud Functions, Cloud Run enabled
- Firebase project with Google OAuth enabled
- KIE AI API key
- Terraform 1.5+

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env.local`:**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_API_URL=https://your-start-generation-function-url
   ```

3. **Run dev server:**
   ```bash
   npm run dev
   ```

### Cloud Functions

Each function has its own directory under `functions/`:

```bash
cd functions/start-generation && npm install
cd functions/webhook-handler && npm install
cd functions/check-status && npm install
cd functions/list-generations && npm install
```

**Environment variables for `start-generation`:**

| Variable | Description |
|----------|-------------|
| `KIE_API_KEY` | KIE AI API key |
| `WEBHOOK_URL` | URL of webhook-handler function |

## Deployment

### Infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Terraform manages:
- Cloud Run service for frontend
- Cloud Functions (all 4)
- Firestore database + security rules + indexes
- GitHub Actions OIDC federation
- Service accounts and IAM

### CI/CD (GitHub Actions)

### CI/CD (GitHub Actions)

Pushes to `main` or `master` trigger a smart, automated deployment pipeline.
The workflow uses **Path Filtering** to only deploy components that have changed:

- **Frontend (Cloud Run)**:
  - Triggers if changes detected in `app/`, `components/`, `lib/`, `public/`, etc.
  - Builds Docker image and deploys to Cloud Run.

- **Cloud Functions**:
  - Each function (`start-generation`, `webhook-handler`, etc.) is tracked independently.
  - Deploys *only* if files in its specific `functions/<name>` directory change.
  - Deploys directly to Google Cloud Functions (Gen 2) using Node.js 22.

All deployments use **OIDC federation** for passwordless, secure authentication with Google Cloud.

## Security

- Firebase ID tokens verified server-side on every request
- Credit deduction enforced server-side
- Firestore security rules restrict reads to own data only
- Cloud Functions use default service account (same project)
- Docker container runs as non-root user
- CI/CD uses OIDC federated identity (no long-lived credentials)

## API Endpoints

### POST `/api/generate`
Proxies to `start-generation` function. Returns NDJSON stream:
```
{"type":"script","text":"..."}     # Streamed script chunks
{"type":"status","message":"..."}  # Status updates
{"type":"done","taskId":"..."}     # Generation started
{"type":"error","message":"..."}   # Error occurred
```

### GET `/api/status/[taskId]`
Returns generation status:
```json
{
  "status": "success",
  "video_url": "https://..."
}
```

### GET `/api/generations`
Returns user's generation history (requires auth).

## License


## Cost Estimation

This architecture is designed to stay within **Google Cloud Free Tier** limits for development and moderate usage.

| Service | Free Tier / Allocation | Estimated Cost (Low Usage) |
|---------|------------------------|----------------------------|
| **Cloud Run** (Frontend) | 2M requests/mo, 360k GB-sec memory | **$0.00** |
| **Cloud Functions** (Backend) | 2M invocations/mo, 400k GB-sec comp | **$0.00** |
| **Firestore** | 1GB storage, 50k reads/day | **$0.00** |
| **Secret Manager** | 6 active secrets (using 1) | **$0.00** |
| **Artifact Registry** | 0.5GB free storage | **$0.00 - $0.10** |
| **Cloud Build** | 120 build-minutes/day | **$0.00** |
| **Cloud Networking** | 5GB egress/mo (standard tier) | **$0.00** |

**Total Estimated Infrastructure Cost: ~$0.00 / month**

> **Note:** The KIE AI API is an external paid service and generates costs per video created:
> *   **6-second video:** 20 credits ($0.10)
> *   **10-second video:** 30 credits ($0.15)
> **Note:** Storing many generated video URLs in Firestore is free (text), but if you choose to download/store video files to Cloud Storage later, standard storage rates apply ($0.02/GB).

