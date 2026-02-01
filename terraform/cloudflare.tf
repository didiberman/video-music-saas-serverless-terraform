# Root domain (A records for vibeflow.video)
resource "cloudflare_record" "root_a_1" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "216.239.32.21"
  type    = "A"
  proxied = false
}
resource "cloudflare_record" "root_a_2" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "216.239.34.21"
  type    = "A"
  proxied = false
}
resource "cloudflare_record" "root_a_3" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "216.239.36.21"
  type    = "A"
  proxied = false
}
resource "cloudflare_record" "root_a_4" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "216.239.38.21"
  type    = "A"
  proxied = false
}

# Root domain (AAAA records for vibeflow.video)
resource "cloudflare_record" "root_aaaa_1" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "2001:4860:4802:32::15"
  type    = "AAAA"
  proxied = false
}
resource "cloudflare_record" "root_aaaa_2" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "2001:4860:4802:34::15"
  type    = "AAAA"
  proxied = false
}
resource "cloudflare_record" "root_aaaa_3" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "2001:4860:4802:36::15"
  type    = "AAAA"
  proxied = false
}
resource "cloudflare_record" "root_aaaa_4" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "2001:4860:4802:38::15"
  type    = "AAAA"
  proxied = false
}

resource "cloudflare_record" "legacy_frontend" {
  zone_id = var.legacy_cloudflare_zone_id
  name    = "saas" # saas.didiberman.com
  content = "ghs.googlehosted.com"
  type    = "CNAME"
  proxied = true
}
