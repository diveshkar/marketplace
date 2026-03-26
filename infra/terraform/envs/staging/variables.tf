variable "project_name" {
  type        = string
  description = "Short project key used in resource names and tags"
  default     = "marketplace"
}

variable "environment" {
  type        = string
  description = "Environment name; must match workspace (staging | prod)"
  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "environment must be staging or prod"
  }
}

variable "aws_region" {
  type        = string
  description = "Primary AWS region"
  default     = "ap-south-1"
}

variable "default_tags" {
  type        = map(string)
  description = "Common tags merged into provider default_tags"
  default = {
    ManagedBy = "Terraform"
  }
}
