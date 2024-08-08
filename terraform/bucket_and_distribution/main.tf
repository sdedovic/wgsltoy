terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5"
    }
  }
}

// Configure Bucket
resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket_name
  tags = {
    Managed = "terraform"
    Project = var.project
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "bucket_encryption" {
  bucket = aws_s3_bucket.bucket.id
  rule {
    bucket_key_enabled = false
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

// Configure User
resource "aws_iam_user" "user" {
  name = "${var.bucket_name}_default_user"
  tags = {
    Managed = "terraform"
    Project = var.project
  }
}

resource "aws_iam_access_key" "user_key" {
  user = aws_iam_user.user.name
}

data "aws_iam_policy_document" "bucket_access" {
  statement {
    actions = [
      "s3:ListBucket"
    ]
    resources = [aws_s3_bucket.bucket.arn]
    effect    = "Allow"
  }
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:PutObjectAcl"
    ]
    resources = ["${aws_s3_bucket.bucket.arn}/*"]
    effect    = "Allow"
  }
}

resource "aws_iam_user_policy" "bucket_access_policy" {
  name   = "bucket-access-policy"
  user   = aws_iam_user.user.name
  policy = data.aws_iam_policy_document.bucket_access.json
}

// Cloudfront
data "aws_iam_policy_document" "cloudfront_access" {
  // allow s3:ListBucket on the S3 Bucket so CloudFront can determine if object can found (HTTP 404)
  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.bucket.arn]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      values   = [aws_cloudfront_distribution.s3_distribution.arn]
      variable = "AWS:SourceArn"
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      values   = [aws_cloudfront_distribution.s3_distribution.arn]
      variable = "AWS:SourceArn"
    }
  }
}

resource "aws_s3_bucket_policy" "cf_access_policy" {
  bucket = aws_s3_bucket.bucket.id
  policy = data.aws_iam_policy_document.cloudfront_access.json
}

resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "${var.bucket_name}_default"
  description                       = "Default S3 Policy"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "default_cache_policy" {
  name        = "${var.bucket_name}_serving"
  default_ttl = 3600
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name              = aws_s3_bucket.bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
    origin_id                = aws_s3_bucket.bucket.id
  }

  enabled = true

  is_ipv6_enabled = true
  http_version    = "http2and3"

  aliases = var.aliases

  default_root_object = var.default_root_object

  dynamic "custom_error_response" {
    for_each = var.custom_error_responses
    iterator = item
    content {
      error_code         = item.value.error_code
      response_code      = item.value.error_code
      response_page_path = startswith(item.value.path, "/") ? item.value.path : "/${item.value.path}"
    }
  }

  default_cache_behavior {
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]
    compress        = true

    target_origin_id = aws_s3_bucket.bucket.id
    cache_policy_id  = aws_cloudfront_cache_policy.default_cache_policy.id

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    acm_certificate_arn            = var.custom_acm_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Managed = "terraform"
    Project = var.project
  }
}
