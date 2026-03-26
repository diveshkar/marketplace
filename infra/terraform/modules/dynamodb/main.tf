# ──────────────────────────────────────────────
# Users
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "users" {
  name         = "${var.name_prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# ──────────────────────────────────────────────
# Listings
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "listings" {
  name         = "${var.name_prefix}-listings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "listingId"

  attribute {
    name = "listingId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-index"
    hash_key        = "userId"
    range_key       = "listingId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# ──────────────────────────────────────────────
# Favorites
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "favorites" {
  name         = "${var.name_prefix}-favorites"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "listingId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "listingId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# ──────────────────────────────────────────────
# Inquiries
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "inquiries" {
  name         = "${var.name_prefix}-inquiries"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "inquiryId"

  attribute {
    name = "inquiryId"
    type = "S"
  }

  attribute {
    name = "buyerUserId"
    type = "S"
  }

  attribute {
    name = "listingId"
    type = "S"
  }

  global_secondary_index {
    name            = "buyerUserId-index"
    hash_key        = "buyerUserId"
    range_key       = "inquiryId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "listingId-index"
    hash_key        = "listingId"
    range_key       = "inquiryId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# ──────────────────────────────────────────────
# Reports
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "reports" {
  name         = "${var.name_prefix}-reports"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "reportId"

  attribute {
    name = "reportId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# ──────────────────────────────────────────────
# Subscriptions
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "subscriptions" {
  name         = "${var.name_prefix}-subscriptions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subscriptionId"

  attribute {
    name = "subscriptionId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}

# ──────────────────────────────────────────────
# Notifications
# ──────────────────────────────────────────────
resource "aws_dynamodb_table" "notifications" {
  name         = "${var.name_prefix}-notifications"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "notificationId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "notificationId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }
}
