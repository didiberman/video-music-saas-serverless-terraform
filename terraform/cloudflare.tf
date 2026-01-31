# Get the custom domain mapping from Cloud Run (Manual mapping often req first, or use a CNAME)
# Cloud Run custom domains are tricky in TF. 
# Simplest approach: Create CNAME to the run.app URL for Cloudflare proxied setup.

resource "cloudflare_record" "saas_frontend" {
  zone_id = local.cloudflare_zone_id
  name    = "saas" # saas.didiberman.com
  content = google_cloud_run_domain_mapping.frontend.status[0].resource_records[0].rrdata
  type    = "CNAME"
  proxied = false # leave DNS-only so Google can verify/issue the managed cert
}
