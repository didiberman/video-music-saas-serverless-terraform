# Secrets Configuration

# 1. KIE API Key
resource "google_secret_manager_secret" "kie_api_key" {
  secret_id = "kie-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "kie_api_key" {
  secret      = google_secret_manager_secret.kie_api_key.id
  secret_data = var.kie_api_key
}

# --- IAM Bindings ---
# Grant the Default Compute Service Account access to these secrets so Cloud Run/Functions can mount them.

data "google_compute_default_service_account" "default" {
}

resource "google_secret_manager_secret_iam_member" "kie_api_key_access" {
  secret_id = google_secret_manager_secret.kie_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}

# 2. Stripe Secret Key
resource "google_secret_manager_secret" "stripe_secret_key" {
  secret_id = "stripe-secret-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "stripe_secret_key" {
  secret      = google_secret_manager_secret.stripe_secret_key.id
  secret_data = var.stripe_secret_key
}

resource "google_secret_manager_secret_iam_member" "stripe_secret_key_access" {
  secret_id = google_secret_manager_secret.stripe_secret_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_compute_default_service_account.default.email}"
}
