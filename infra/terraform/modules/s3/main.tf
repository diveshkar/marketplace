resource "aws_s3_bucket" "listing_uploads" {
  bucket_prefix = "${var.name_prefix}-listings-"

  tags = {
    Purpose = "listing-image-uploads"
  }
}

resource "aws_s3_bucket_public_access_block" "listing_uploads" {
  bucket = aws_s3_bucket.listing_uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "listing_uploads" {
  bucket = aws_s3_bucket.listing_uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "listing_uploads" {
  bucket = aws_s3_bucket.listing_uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "HEAD", "GET"]
    allowed_origins = var.cors_allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}
