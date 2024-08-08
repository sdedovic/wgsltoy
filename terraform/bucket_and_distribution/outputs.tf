output "cloudfront_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "cloudfront_hosted_zone_id" {
  value = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
}

output "bucket_name" {
  value = aws_s3_bucket.bucket.bucket
}

output "bucket_region" {
  value = aws_s3_bucket.bucket.region
}

output "bucket_user" {
  value = aws_iam_user.user.name
}

output "bucket_user_key_id" {
  sensitive = true
  value     = aws_iam_access_key.user_key.id
}

output "bucket_user_key_secret" {
  sensitive = true
  value     = aws_iam_access_key.user_key.secret
}
