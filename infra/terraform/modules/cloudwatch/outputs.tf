output "api_log_group_name" {
  description = "CloudWatch log group for API"
  value       = aws_cloudwatch_log_group.api.name
}

output "api_log_group_arn" {
  description = "CloudWatch log group ARN for API"
  value       = aws_cloudwatch_log_group.api.arn
}

output "worker_log_group_name" {
  description = "CloudWatch log group for async workers"
  value       = aws_cloudwatch_log_group.worker.name
}

output "worker_log_group_arn" {
  description = "CloudWatch log group ARN for async workers"
  value       = aws_cloudwatch_log_group.worker.arn
}
