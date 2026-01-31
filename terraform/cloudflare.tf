# CNAME to the Cloud Run default .run.app URL with Cloudflare proxy handling SSL.
resource "cloudflare_record" "saas_frontend" {
  zone_id = local.cloudflare_zone_id
  name    = "saas" # saas.didiberman.com
  content = replace(google_cloud_run_v2_service.frontend.uri, "https://", "")
  type    = "CNAME"
  proxied = true # Cloudflare handles SSL termination
}
