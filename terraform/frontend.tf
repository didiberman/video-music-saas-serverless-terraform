resource "google_cloud_run_v2_service" "frontend" {
  name     = "video-saas-frontend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "gcr.io/${var.project_id}/video-saas:latest" # Image must be built/pushed separately

      env {
        name  = "NEXT_PUBLIC_FIREBASE_API_KEY"
        value = var.firebase_api_key
      }
      env {
        name  = "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
        value = var.firebase_auth_domain
      }
      env {
        name  = "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        value = var.firebase_project_id
      }
      # Inject the Backend Function URL into the Frontend
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloudfunctions2_function.start_generation.service_config[0].uri
      }
      env {
        name  = "NEXT_PUBLIC_APP_URL"
        value = "https://${var.domain_name}"
      }
    }
    scaling {
      max_instance_count = 10
    }
  }

  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].containers[0].image,
      template[0].labels
    ]
  }
}

# Map custom domain to Cloud Run service.
# Google provisions a managed SSL certificate for this domain.
resource "google_cloud_run_domain_mapping" "frontend" {
  location = var.region
  name     = var.domain_name

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.frontend.name
  }
}

# Allow public access to frontend
resource "google_cloud_run_v2_service_iam_member" "public_frontend" {
  name     = google_cloud_run_v2_service.frontend.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
