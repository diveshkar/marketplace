variable "name_prefix" {
  type        = string
  description = "Namespace prefix for IAM roles/policies (wired in later phases)"
}

# Phase 2: IAM module boundary only (PLAN_v2). No IAM resources yet.

output "name_prefix" {
  description = "Echo naming prefix for environment outputs"
  value       = var.name_prefix
}
