output "bucket_id" {
  description = "S3 bucket name (id) for listing uploads"
  value       = aws_s3_bucket.listing_uploads.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.listing_uploads.arn
}
