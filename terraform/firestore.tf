resource "google_firestore_database" "database" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"

  # Depends on API being enabled
  depends_on = [google_project_service.apis]
}

# Firestore Security Rules
resource "google_firebaserules_ruleset" "firestore" {
  project = var.project_id

  source {
    files {
      name    = "firestore.rules"
      content = <<-EOT
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Generations: users can read their own
            match /generations/{docId} {
              allow read: if request.auth != null && resource.data.user_id == request.auth.uid;
              allow write: if false;
            }
            // Credits: users can read their own
            match /credits/{userId} {
              allow read: if request.auth != null && request.auth.uid == userId;
              allow write: if false;
            }
          }
        }
      EOT
    }
  }

  depends_on = [google_firestore_database.database]
}

resource "google_firebaserules_release" "firestore" {
  project      = var.project_id
  name         = "cloud.firestore"
  ruleset_name = google_firebaserules_ruleset.firestore.name

  depends_on = [google_firebaserules_ruleset.firestore]
}

# Composite index for querying generations by user_id + created_at
resource "google_firestore_index" "generations_user_created" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "generations"

  fields {
    field_path = "user_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "created_at"
    order      = "DESCENDING"
  }

  depends_on = [google_firestore_database.database]
}
