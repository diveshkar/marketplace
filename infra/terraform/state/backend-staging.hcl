bucket         = "company-terraform-state"
key            = "marketplace/staging/terraform.tfstate"
region         = "ap-south-1"
encrypt        = true
dynamodb_table = "terraform-locks-staging"
