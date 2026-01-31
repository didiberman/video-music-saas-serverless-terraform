# PLAN: Minimalist AI Video SaaS (Zen Portal)

## 1. Overview
A "Zen" minimalist, high-tech SaaS for generating videos from text.
**Key Features:**
- **Aesthetics:** "Glass Portal" login, immersive "Deep Matte" creation flow.
- **Access:** Social Logins (Google, Github, Apple, FB) via Supabase.
- **Core Loop:** Users get 30s free generation. System queues job with KIE AI.
- **Architecture:** 
    - **Frontend:** Next.js 14 on Cloud Run (Managed by Terraform).
    - **Backend:** Google Cloud Run Functions (Managed by Terraform).
    - **Infra:** Terraform for everything (GCP + Cloudflare).

## 2. Infrastructure as Code (Terraform)
We will use Terraform to manage the entire stack.
- **Provider:** `google`, `cloudflare`.
- **State:** Local (for now) or GCS.
- **Resources:**
    - `google_cloud_run_v2_service` (Frontend)
    - `google_cloudfunctions2_function` (Backend Logic)
    - `cloudflare_record` (DNS for `saas.didiberman.com`)

## 3. Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS.
- **Backend:** Node.js 20 Cloud Functions (2nd Gen).
- **Auth:** Firebase Auth (Google Identity Platform).
- **Database:** Google Firestore (NoSQL, Serverless).
- **Secrets:** `terraform.tfvars`.

## 4. Implementation Stages

### Phase 1: Foundation (Done)
- [x] Initialize Next.js Project.
- [x] Setup Vault Connectivity.

### Phase 2: User Interface (Done)
- [x] Login Screen & Dashboard.
- [x] Video Drawer.

### Phase 3: Backend Refactor (The Pivot)
- [ ] **Source Code Separation:**
    - `functions/start-generation/`: Node.js function to handle requests.
    - `functions/handle-webhook/`: Node.js function to handle KIE AI callbacks.
- [ ] **Terraform Setup (Infrastructure + DB):**
    - Define Cloud Run service & Cloud Functions.
    - **Database Automation:** Use `cyrilgdn/postgresql` or standard `hashicorp/postgresql` provider to connect to Supabase and apply Schema (`supabase/schema.sql` logic translated to TF resources).

### Phase 4: Polish & Delivery
- [ ] **Deployment:**
    - Build Next.js container -> GCR.
    - Zip Functions -> GCS.
    - `terraform apply`.
- [ ] **Verification:** Test end-to-end flow.

## 5. Directory Structure
```
/
├── app/                # Next.js Frontend
├── functions/          # Backend Logic
│   ├── start-generation/
│   │   ├── index.js
│   │   └── package.json
│   └── handle-webhook/
│       ├── index.js
│       └── package.json
├── terraform/          # Infrastructure
│   ├── main.tf
│   ├── functions.tf
│   ├── frontend.tf
│   └── cloudflare.tf
└── lib/                # Shared logic
```
