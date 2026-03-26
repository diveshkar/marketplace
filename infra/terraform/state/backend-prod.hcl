bucket         = "company-terraform-state"
key            = "marketplace/prod/terraform.tfstate"
region         = "ap-south-1"
encrypt        = true
dynamodb_table = "terraform-locks-prod"
