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
    runtime     = "nodejs22"
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
      WEBHOOK_URL = google_cloudfunctions2_function.webhook_handler.service_config[0].uri
    }

    secret_environment_variables {
      key        = "KIE_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.kie_api_key.secret_id
      version    = "latest"
    }
  }

  lifecycle {
    ignore_changes = [build_config[0].source]
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
    runtime     = "nodejs22"
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

  lifecycle {
    ignore_changes = [build_config[0].source]
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

# --- MUSIC GENERATION ---

# Zip Source for Start Music Generation
data "archive_file" "start_music_generation_zip" {
  type        = "zip"
  source_dir  = "../functions/start-music-generation"
  output_path = "./dist/start-music-generation.zip"
  excludes    = ["node_modules"]
}

resource "google_storage_bucket_object" "start_music_generation_obj" {
  name   = "start-music-generation-${data.archive_file.start_music_generation_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.start_music_generation_zip.output_path
}

# Start Music Generation Cloud Function
resource "google_cloudfunctions2_function" "start_music_generation" {
  name     = "start-music-generation"
  location = var.region

  build_config {
    runtime     = "nodejs22"
    entry_point = "startMusicGeneration"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.start_music_generation_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 120 # Music takes longer

    environment_variables = {
      WEBHOOK_URL = google_cloudfunctions2_function.webhook_handler.service_config[0].uri
    }

    secret_environment_variables {
      key        = "KIE_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.kie_api_key.secret_id
      version    = "latest"
    }
  }

  lifecycle {
    ignore_changes = [build_config[0].source]
  }
}

# Allow public invocation for music generation
resource "google_cloud_run_service_iam_member" "public_start_music_generation" {
  location = google_cloudfunctions2_function.start_music_generation.location
  service  = google_cloudfunctions2_function.start_music_generation.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Zip Source for Check Status
data "archive_file" "check_status_zip" {
  type        = "zip"
  source_dir  = "../functions/check-status"
  output_path = "./dist/check-status.zip"
  excludes    = ["node_modules"]
}

resource "google_storage_bucket_object" "check_status_obj" {
  name   = "check-status-${data.archive_file.check_status_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.check_status_zip.output_path
}

# Check Status Cloud Function
resource "google_cloudfunctions2_function" "check_status" {
  name        = "check-status"
  location    = var.region
  description = "Check video generation status"

  build_config {
    runtime     = "nodejs22"
    entry_point = "checkStatus"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.check_status_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 30
  }

  lifecycle {
    ignore_changes = [build_config[0].source]
  }
}

# Allow public invocation for check-status
resource "google_cloud_run_service_iam_member" "public_check_status" {
  location = google_cloudfunctions2_function.check_status.location
  service  = google_cloudfunctions2_function.check_status.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Zip Source for List Generations
data "archive_file" "list_generations_zip" {
  type        = "zip"
  source_dir  = "../functions/list-generations"
  output_path = "./dist/list-generations.zip"
  excludes    = ["node_modules"]
}

resource "google_storage_bucket_object" "list_generations_obj" {
  name   = "list-generations-${data.archive_file.list_generations_zip.output_md5}.zip"
  bucket = google_storage_bucket.function_bucket.name
  source = data.archive_file.list_generations_zip.output_path
}

# List Generations Cloud Function
resource "google_cloudfunctions2_function" "list_generations" {
  name        = "list-generations"
  location    = var.region
  description = "List user video generations"

  build_config {
    runtime     = "nodejs22"
    entry_point = "listGenerations"
    source {
      storage_source {
        bucket = google_storage_bucket.function_bucket.name
        object = google_storage_bucket_object.list_generations_obj.name
      }
    }
  }

  service_config {
    max_instance_count = 10
    available_memory   = "256M"
    timeout_seconds    = 30
  }

  lifecycle {
    ignore_changes = [build_config[0].source]
  }
}

# Allow public invocation for list-generations
resource "google_cloud_run_service_iam_member" "public_list_generations" {
  location = google_cloudfunctions2_function.list_generations.location
  service  = google_cloudfunctions2_function.list_generations.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
