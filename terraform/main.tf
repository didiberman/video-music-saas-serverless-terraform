# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com",
    "firebaserules.googleapis.com"
  ])

  service            = each.key
  disable_on_destroy = false
}
