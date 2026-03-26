variable "name_prefix" {
  type        = string
  description = "Prefix used in the S3 bucket name (environment-scoped)."
}

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Origins allowed for browser PUT/GET of listing images (presigned uploads)."
  default     = ["*"]
}
