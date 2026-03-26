variable "name_prefix" {
  type        = string
  description = "Resource naming prefix (e.g. marketplace-staging)"
}

variable "allow_user_password_auth" {
  type        = bool
  description = "Expose ALLOW_USER_PASSWORD_AUTH for smoke tests; prefer false in production"
  default     = false
}
