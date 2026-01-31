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
  default     = "saas.didiberman.com"
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
}

variable "firebase_auth_domain" {
  description = "Firebase Auth Domain"
  type        = string
}

variable "kiesaas_service_account_json" {
  description = "JSON key for the external KIE SaaS Firebase project (for Auth verification)"
  type        = string
  sensitive   = true
}
