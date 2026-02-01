variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region for resources"
  type        = string
  default     = "us-central1"
}

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  default     = "vibeflow.video"
}

variable "stripe_secret_key" {
  description = "Stripe Secret Key for payment processing"
  type        = string
  sensitive   = true
}

variable "legacy_domain_name" {
  description = "Previous domain name to redirect from"
  type        = string
  default     = "saas.didiberman.com"
}

variable "legacy_cloudflare_zone_id" {
  description = "Zone ID for the legacy domain"
  type        = string
  default     = ""
}

# Secrets
variable "kie_api_key" {
  description = "KIE AI API Key"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_key" {
  description = "Cloudflare API Key"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

# Firebase Config (Public, but managed via vars)
variable "firebase_api_key" {
  description = "Firebase Web API Key"
  type        = string
  default     = "AIzaSyCpuuD51EkkiGIpr57FT_RqikO6Bdplrec"
}

variable "firebase_auth_domain" {
  description = "Firebase Auth Domain"
  type        = string
  default     = "gen-lang-client-0104807788.firebaseapp.com"
}

variable "firebase_project_id" {
  description = "Firebase Project ID"
  type        = string
  default     = "gen-lang-client-0104807788"
}


