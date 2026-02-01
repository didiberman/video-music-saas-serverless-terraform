# VibeFlow - AI Video & Music Generator

A minimalist AI-powered video and music generation platform. Users describe a video or song idea (via text or voice), the system generates content using Google Gemini + KIE AI — all through a sleek glassmorphism interface.

## Architecture Overview

```mermaid
graph TD
    User[User Browser] -->|Voice/Text Input| NextJS[Next.js Frontend (Cloud Run)]
    
    subgraph "Frontend Services"
        NextJS -->|/api/generate| StartGen[start-generation]
        NextJS -->|/api/generate-music| StartMusic[start-music-generation]
        NextJS -->|/api/checkout| CreateCheckout[create-checkout-session]
        NextJS -->|/api/transactions| ListTx[list-transactions]
        NextJS -->|/api/status| CheckStatus[check-status]
    end

    subgraph "Backend (Cloud Functions)"
        StartGen -->|Gen Script| VertexAI[Vertex AI (Gemini)]
        StartGen -->|Gen Video| KIE[KIE AI (Video)]
        StartMusic -->|Gen Lyrics| VertexAI
        StartMusic -->|Gen Music| KIE_Suno[KIE AI (Suno)]
        
        CreateCheckout -->|Create Session| Stripe[Stripe API]
        
        Stripe -->|Webhook| PaymentHook[payment-webhook]
    end

    subgraph "Data & Storage"
        Firestore[(Firestore)]
        SecretMgr[Secret Manager]
    end

    PaymentHook -->|Update Credits| Firestore
    StartGen -->|Deduct Credits| Firestore
    StartMusic -->|Deduct Credits| Firestore
    
    KIE -->|Webhook| WebhookHandler[webhook-handler]
    KIE_Suno -->|Webhook| WebhookHandler
    WebhookHandler -->|Update Status| Firestore
```

## Features

### AI Generation ✨
- **Text-to-Video** — Describe a scene, choose style/duration, and get a video in ~60s.
- **Text-to-Music** — Describe a vibe, get a unique song with AI-written lyrics in ~60s.
- **Voice Input** — Speak your ideas directly using browser Speech API.
- **Streaming Scripts** — Watch the AI write your video script or song lyrics in real-time.

### Monetization & Credits 💎
- **Unified Credit System** — One currency for both video and music.
    - **1 Video Second** = 1 Credit
    - **1 Song** = 10 Credits
- **Stripe Integration** — Secure payments for credit packs.
- **Pricing Page** — Transparent pricing tiers (Starter, Creator, Pro).
- **Billing History** — Detailed "Invoice" view showing all payments and exact credit usage per generation.
- **Free Trial** — New users get **30 Credits** free (3 videos or 3 songs).

### UI/UX 🎨
- **Glassmorphism Design** — Premium, dark-themed UI with ambient animations.
- **Video Vault** — Slide-out drawer to manage your creation history.
- **Public Gallery** — Browse community creations without logging in.
- **Responsive** — Fully optimized for mobile and desktop.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Google Cloud Functions Gen 2 (Node.js 22) |
| **Database** | Google Firestore (NoSQL) |
| **Payments** | Stripe (w/ Webhooks & Checkout sessions) |
| **AI Models** | Google Gemini 1.5 Flash (Script/Lyrics), KIE AI (Video/Suno) |
| **Infra** | Terraform (IaC), Google Secret Manager |
| **CI/CD** | GitHub Actions (OIDC Federation, Path Filtering) |

## Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── pricing/page.tsx          # Pricing & Plans page
│   ├── login/page.tsx            # Login with Public Gallery
│   ├── page.tsx                  # Main generation dashboard
│   └── api/                      # API Proxies
├── components/
│   ├── PricingCards.tsx          # Reusable pricing UI
│   ├── TransactionHistory.tsx    # Billing & Usage history
│   ├── CreditsModal.tsx          # Purchase & History modal
│   ├── CreditsBadge.tsx          # Header credit balance
│   ├── VideoGallery.tsx          # User vault
│   └── ...
├── functions/                    # Google Cloud Functions
│   ├── start-generation/         # Video logic (Gemini + KIE)
│   ├── start-music-generation/   # Music logic (Gemini + Suno)
│   ├── create-checkout-session/  # Stripe Checkout init
│   ├── payment-webhook/          # Stripe Webhook handler
│   ├── list-transactions/        # Billing history fetcher
│   ├── check-status/             # Status polling
│   ├── list-generations/         # User history
│   └── webhook-handler/          # KIE AI callback handler
├── terraform/                    # Infrastructure as Code
│   ├── main.tf, functions.tf     # Core infra definitions
│   ├── secrets.tf                # Secret Manager config
│   └── ...
└── .github/workflows/            # CI/CD
    └── deploy.yml                # Smart deployment pipeline
```

## Data Model (Firestore)

### `credits` bucket
Tracks user balance.
- `seconds_remaining` (number): Unified credit balance (legacy name).
- `is_pro` (boolean): True if user has made a purchase.

### `transactions` bucket
Immutable record of payments.
- `uid` (string): User ID.
- `amount` (number): Amount in cents.
- `credits` (number): Credits purchased.
- `packId` (string): 'starter', 'creator', etc.
- `status` (string): 'completed'.

### `generations` bucket
Record of all AI jobs.
- `original_prompt` (string): Input prompt.
- `type` (string): 'video' (default) or 'music'.
- `cost` (number): Credits deducted for this job.
- `status` (string): 'waiting', 'success', 'error'.
- `video_url` / `audio_url`: Result links.

## Getting Started

### Prerequisites
- Node.js 22+
- Google Cloud Project (Billing Enabled)
- Stripe Account (for payments)
- KIE AI Account (for generation)

### Environment Setup
1.  **Clone & Install**:
    ```bash
    npm install
    # Install function dependencies
    cd functions/start-generation && npm install && cd ../..
    # ... repeat for all functions
    ```

2.  **Configure Vars**:
    Create `.env.local` for frontend:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    ```

### Terraform Deployment
Infrastructure is fully managed via Terraform.

```bash
cd terraform
terraform init
terraform apply
```
This will provision:
- ALL Cloud Functions (from local source)
- Firestore Database & Indexes
- Secret Manager secrets (Stripe Key, KIE Key)
- Cloud Run service (Frontend)

---
*made by didi with ❤️*
