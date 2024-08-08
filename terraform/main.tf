terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.61"
    }
  }
}

provider "aws" {
  region = "us-east-2"
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

locals {
  domain      = "wgsltoy.com"
  subdomain   = "test"
  bucket_name = "wgsltoy-com-site"
}

data "aws_route53_zone" "zone" {
  name         = local.domain
  private_zone = false
}

/* SSL Certificate and Domain Validation */
resource "aws_acm_certificate" "certificate" {
  domain_name       = local.domain
  validation_method = "DNS"

  provider = aws.us-east-1
}

resource "aws_route53_record" "dns_validation_record" {
  for_each = {
    for dvo in aws_acm_certificate.certificate.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.zone.zone_id
}

resource "aws_acm_certificate_validation" "validation" {
  certificate_arn         = aws_acm_certificate.certificate.arn
  validation_record_fqdns = [for record in aws_route53_record.dns_validation_record : record.fqdn]
  provider                = aws.us-east-1
}

/* Static Hosting */
module "static_hosting" {
  source = "./bucket_and_distribution"

  bucket_name         = local.bucket_name
  project             = local.bucket_name
  default_root_object = "index.html"
  custom_error_responses = [{
    error_code = 404
    path       = "404.html"
  }]
  custom_acm_certificate_arn = aws_acm_certificate_validation.validation.certificate_arn
  aliases                    = [local.domain]

  providers = {
    aws = aws
  }
}

resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.zone.zone_id

  name = local.domain
  type = "A"

  alias {
    name                   = module.static_hosting.cloudfront_domain
    zone_id                = module.static_hosting.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

output "s3_bucket_name" {
  value = module.static_hosting.bucket_name
}

output "s3_bucket_region" {
  value = module.static_hosting.bucket_region
}

output "cloudfront_distribution_id" {
  value = module.static_hosting.cloudfront_id
}
