# CNAME to Google's domain mapping endpoint.
# Cloud Run domain mapping handles SSL via Google-managed certificate.
resource "cloudflare_record" "saas_frontend" {
  zone_id = local.cloudflare_zone_id
  name    = "saas" # saas.didiberman.com
  content = "ghs.googlehosted.com"
  type    = "CNAME"
  proxied = false # DNS-only so Google can verify domain and provision managed cert
}
