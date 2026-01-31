# Video Zen - AI Video Generation SaaS

A minimalist AI-powered video generation platform. Users describe a video idea, the system enhances it into a script using Google Gemini, and generates a video via KIE AI -- all through a sleek glass morphism interface.

## Architecture Overview

```
User -> Next.js Frontend (Cloud Run)
          |
          v
      /api/generate (proxy)
          |
          v
   start-generation (Cloud Function)
      |         |
      v         v
  Gemini    Firestore
  (script)   (credits + generations)
      |
      v
   KIE AI (video generation)
      |
      v
   webhook-handler (Cloud Function)
      |
      v
   Firestore (video_url updated)
```

## Features

- **Google OAuth** login via Firebase Authentication
- **AI script generation** -- user prompts are refined into video scripts using Vertex AI (Gemini 1.5 Flash)
- **Async video generation** via KIE AI with webhook-based completion
- **Credit system** -- 30 free seconds per account, 5 seconds deducted per generation
- **Video Vault** -- history drawer to browse generated videos
- **Glass morphism UI** -- dark theme with backdrop blur, Framer Motion animations

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Google Cloud Functions (Node.js 20) |
| Database | Google Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| AI | Google Vertex AI (Gemini 1.5 Flash), KIE AI (video model k-2.0) |
| Hosting | Google Cloud Run (containerized) |
| Infrastructure | Terraform, GitHub Actions (OIDC) |
| DNS/CDN | Cloudflare |

## Project Structure

```
.
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Geist fonts)
│   ├── page.tsx                # Main dashboard / generation page
│   ├── login/page.tsx          # Google OAuth login
│   ├── api/generate/route.ts   # Proxy to Cloud Function
│   └── globals.css             # Tailwind + glass morphism styles
├── components/
│   ├── GlassCard.tsx           # Animated glass card component
│   └── VideoDrawer.tsx         # Video vault slide-out panel
├── lib/
│   ├── firebase/client.ts      # Firebase SDK initialization
│   ├── kie.ts                  # KIE AI API client
│   ├── vault.ts                # HashiCorp Vault integration
│   └── utils.ts                # cn() utility (clsx + tailwind-merge)
├── functions/
│   ├── start-generation/       # Validates auth, calls Gemini + KIE AI
│   └── webhook-handler/        # Receives KIE AI callbacks, updates Firestore
├── terraform/                  # Infrastructure as Code (GCP + Cloudflare)
│   ├── main.tf                 # API enablement
│   ├── frontend.tf             # Cloud Run + domain mapping
│   ├── functions.tf            # Cloud Functions deployment
│   ├── firestore.tf            # Database
│   ├── oidc.tf                 # GitHub Actions OIDC federation
│   ├── secrets.tf              # Sensitive variable mappings
│   ├── cloudflare.tf           # DNS records
│   └── variables.tf            # Input variables
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline
├── Dockerfile                  # Multi-stage build (node:20-alpine)
├── cloudbuild.yaml             # Google Cloud Build config
└── docs/
    └── PLAN-video-saas.md      # Architecture planning document
```

## User Flow

1. User signs in with Google on `/login`
2. Enters a video description on the main dashboard
3. Frontend sends prompt + Firebase ID token to `/api/generate`
4. `start-generation` Cloud Function:
   - Verifies the Firebase token
   - Checks credit balance (minimum 5 seconds required)
   - Sends prompt to Gemini to generate a refined video script
   - Submits script to KIE AI for video generation
   - Stores generation record in Firestore with status `pending`
   - Deducts 5 seconds from user credits
5. KIE AI generates the video asynchronously
6. On completion, KIE AI calls `webhook-handler` with the video URL
7. Webhook updates the Firestore document with `video_url` and final status
8. User views completed videos in the Vault drawer

## Data Model (Firestore)

**`credits` collection**
| Field | Type | Description |
|---|---|---|
| `seconds_remaining` | number | Available credits (default: 30) |
| `updated_at` | timestamp | Last modification time |

Document ID = Firebase UID.

**`generations` collection**
| Field | Type | Description |
|---|---|---|
| `user_id` | string | Firebase UID |
| `original_prompt` | string | User's input text |
| `generated_script` | string | Gemini-enhanced script |
| `status` | string | `pending` / `processing` / `completed` / `failed` |
| `kie_id` | string | KIE AI job ID |
| `video_url` | string | Final video URL (set by webhook) |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

Document ID = KIE AI job ID.

## Getting Started

### Prerequisites

- Node.js 20+
- A Google Cloud project with Firestore, Cloud Functions, and Cloud Run enabled
- Firebase project with Google OAuth enabled
- KIE AI API key
- Terraform 1.5+ (for infrastructure provisioning)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables** (create `.env.local`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_API_URL=https://your-cloud-function-url
   ```

3. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Cloud Functions

Each function has its own `package.json` under `functions/`:

```bash
cd functions/start-generation && npm install
cd functions/webhook-handler && npm install
```

**Required environment variables for `start-generation`:**
| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin SDK credentials (JSON string) |
| `KIE_API_KEY` | KIE AI API key |
| `WEBHOOK_URL` | URL of the deployed webhook-handler function |

## Deployment

### Infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

**Required Terraform variables** (in `terraform.tfvars`):
```hcl
project_id                  = "your-gcp-project"
region                      = "us-central1"
domain_name                 = "your-domain.com"
kie_api_key                 = "your-kie-api-key"
firebase_api_key            = "your-firebase-api-key"
firebase_auth_domain        = "your-project.firebaseapp.com"
cloudflare_api_key          = "your-cloudflare-token"
cloudflare_zone_id          = "your-zone-id"
kiesaas_service_account_json = "{...}"
```

### CI/CD (GitHub Actions)

Pushes to `main` or `master` trigger automatic deployment:

1. Authenticates to GCP via OIDC (no stored secrets)
2. Builds Docker image with Firebase config injected as build args
3. Pushes image to Google Container Registry
4. Deploys to Cloud Run

The OIDC federation is configured in `terraform/oidc.tf` -- GitHub Actions assumes a GCP service account without long-lived credentials.

## Security

- Firebase ID tokens are verified server-side on every generation request
- Credit deduction is enforced server-side (cannot be bypassed by the client)
- Cloud Functions run with least-privilege service accounts
- Sensitive values are managed via Terraform variables (marked `sensitive`)
- Optional HashiCorp Vault integration for secrets management
- Docker container runs as non-root user (`nextjs:nodejs`)
- CI/CD uses OIDC federated identity (no secret keys stored in GitHub)

## License

Private repository.
