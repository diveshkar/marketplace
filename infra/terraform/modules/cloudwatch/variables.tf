variable "name_prefix" {
  type        = string
  description = "Resource naming prefix (e.g. marketplace-staging)"
}

variable "log_retention_days" {
  type        = number
  description = "CloudWatch log group retention in days"
  default     = 30
}

variable "alarm_sns_topic_arn" {
  type        = string
  description = "SNS topic ARN for alarm notifications (empty = alarms created but no actions)"
  default     = ""
}
