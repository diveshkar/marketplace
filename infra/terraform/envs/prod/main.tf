locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}

module "iam_base" {
  source      = "../../modules/iam"
  name_prefix = local.name_prefix
}

module "cognito" {
  source                   = "../../modules/cognito"
  name_prefix              = local.name_prefix
  allow_user_password_auth = false
}

module "dynamodb" {
  source      = "../../modules/dynamodb"
  name_prefix = local.name_prefix
}

module "s3_listing_uploads" {
  source      = "../../modules/s3"
  name_prefix = local.name_prefix
}

module "cloudwatch" {
  source             = "../../modules/cloudwatch"
  name_prefix        = local.name_prefix
  log_retention_days = 90
}
