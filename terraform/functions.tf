resource "google_storage_bucket" "function_bucket" {
  name                        = "${var.project_id}-gcf-source"
  location                    = var.region
  uniform_bucket_level_access = true
}

# Zip Source for Start Generation
data "archive_file" "start_generation_zip" {
  type        = "zip"
  source_dir  = "../functions/start-generation"
  output_path = "./dist/start-generation.zip"
  excludes    = ["node_modules"]
}

resource "google_storage_bucket_object" "start_generation_obj" {
  name   = "start-generation-${data.archive_file.start_generation_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.start_generation_zip.output_path
}

# Start Generation Cloud Function
resource "google_cloudfunctions2_function" "start_generation" {
  name     = "start-generation"
  location = var.region

  build_config {
    runtime     = "nodejs20"
    entry_point = "startGeneration"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.start_generation_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 60

    environment_variables = {
      KIE_API_KEY = local.kie_api_key
      # Needs webhook URL to point to the other function
      WEBHOOK_URL                   = "https://${var.region}-${var.project_id}.cloudfunctions.net/webhook-handler"
      FIREBASE_SERVICE_ACCOUNT_JSON = local.kiesaas_service_account_json
    }
  }
}

# Zip Source for Webhook Handler
data "archive_file" "webhook_handler_zip" {
  type        = "zip"
  source_dir  = "../functions/webhook-handler"
  output_path = "./dist/webhook-handler.zip"
  excludes    = ["node_modules"]
}

resource "google_storage_bucket_object" "webhook_handler_obj" {
  name   = "webhook-handler-${data.archive_file.webhook_handler_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.webhook_handler_zip.output_path
}

# Webhook Handler Cloud Function
resource "google_cloudfunctions2_function" "webhook_handler" {
  name        = "webhook-handler"
  location    = var.region
  description = "Handles KIE AI callbacks"

  build_config {
    runtime     = "nodejs20"
    entry_point = "handleWebhook"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.webhook_handler_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 60
    # No env vars needed, uses default credentials for Firestore
  }
}

# Allow public invocation for webhook (so KIE AI can call it)
resource "google_cloud_run_service_iam_member" "public_webhook" {
  location = google_cloudfunctions2_function.webhook_handler.location
  service  = google_cloudfunctions2_function.webhook_handler.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow public invocation for start-generation (controlled by App Logic Auth)
# Or restrict to Frontend service account if possible. For now public is easier to debug.
resource "google_cloud_run_service_iam_member" "public_start_generation" {
  location = google_cloudfunctions2_function.start_generation.location
  service  = google_cloudfunctions2_function.start_generation.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
