output "users_table_name" {
  description = "DynamoDB users table name"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "DynamoDB users table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "listings_table_name" {
  description = "DynamoDB listings table name"
  value       = aws_dynamodb_table.listings.name
}

output "listings_table_arn" {
  description = "DynamoDB listings table ARN"
  value       = aws_dynamodb_table.listings.arn
}

output "favorites_table_name" {
  description = "DynamoDB favorites table name"
  value       = aws_dynamodb_table.favorites.name
}

output "favorites_table_arn" {
  description = "DynamoDB favorites table ARN"
  value       = aws_dynamodb_table.favorites.arn
}

output "inquiries_table_name" {
  description = "DynamoDB inquiries table name"
  value       = aws_dynamodb_table.inquiries.name
}

output "inquiries_table_arn" {
  description = "DynamoDB inquiries table ARN"
  value       = aws_dynamodb_table.inquiries.arn
}

output "reports_table_name" {
  description = "DynamoDB reports table name"
  value       = aws_dynamodb_table.reports.name
}

output "reports_table_arn" {
  description = "DynamoDB reports table ARN"
  value       = aws_dynamodb_table.reports.arn
}

output "subscriptions_table_name" {
  description = "DynamoDB subscriptions table name"
  value       = aws_dynamodb_table.subscriptions.name
}

output "subscriptions_table_arn" {
  description = "DynamoDB subscriptions table ARN"
  value       = aws_dynamodb_table.subscriptions.arn
}

output "notifications_table_name" {
  description = "DynamoDB notifications table name"
  value       = aws_dynamodb_table.notifications.name
}

output "notifications_table_arn" {
  description = "DynamoDB notifications table ARN"
  value       = aws_dynamodb_table.notifications.arn
}
