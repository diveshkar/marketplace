output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.this.arn
}

output "user_pool_client_id" {
  description = "Public app client ID (no secret)"
  value       = aws_cognito_user_pool_client.web.id
}

output "issuer" {
  description = "OpenID issuer URL for JWT validation"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

output "aws_region" {
  description = "Region hosting the pool"
  value       = data.aws_region.current.name
}
