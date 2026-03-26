output "account_id" {
  description = "AWS account targeted by this workspace"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "Configured AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "name_prefix" {
  description = "Resource naming prefix for this environment"
  value       = local.name_prefix
}

output "iam_base_name_prefix" {
  description = "IAM scaffold module echo (PLAN_v2 Phase 2)"
  value       = module.iam_base.name_prefix
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "cognito_issuer" {
  value = module.cognito.issuer
}

output "dynamodb_users_table_name" {
  value = module.dynamodb.users_table_name
}

output "dynamodb_listings_table_name" {
  value = module.dynamodb.listings_table_name
}

output "dynamodb_favorites_table_name" {
  value = module.dynamodb.favorites_table_name
}

output "dynamodb_inquiries_table_name" {
  value = module.dynamodb.inquiries_table_name
}

output "dynamodb_reports_table_name" {
  value = module.dynamodb.reports_table_name
}

output "dynamodb_subscriptions_table_name" {
  value = module.dynamodb.subscriptions_table_name
}

output "dynamodb_notifications_table_name" {
  value = module.dynamodb.notifications_table_name
}

output "s3_listing_uploads_bucket_name" {
  description = "Private S3 bucket for listing images (browser PUT via presigned URLs; tighten CORS origins in prod)."
  value       = module.s3_listing_uploads.bucket_id
}

output "s3_listing_uploads_bucket_arn" {
  value = module.s3_listing_uploads.bucket_arn
}

output "cloudwatch_api_log_group" {
  value = module.cloudwatch.api_log_group_name
}

output "cloudwatch_worker_log_group" {
  value = module.cloudwatch.worker_log_group_name
}
