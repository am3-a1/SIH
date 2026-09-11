# ==============================================================================
# SIH26095: Ministry of Social Justice and Empowerment (MoSJE)
# Terraform Infrastructure-as-Code for NIC MeghRaj GovCloud / AWS GovCloud
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default     = "ap-south-1" # MeitY empanelled India Region (NIC Cloud compatible)
  description = "Target deployment region"
}

variable "environment" {
  default = "production"
}

# ------------------------------------------------------------------------------
# 1. GOVCLOUD VPC & SECURITY ISOLATION
# ------------------------------------------------------------------------------
resource "aws_vpc" "dosje_vpc" {
  cidr_block           = "10.120.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "dosje-sih26095-vpc"
    Ministry    = "MoSJE"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_app_subnet_1" {
  vpc_id            = aws_vpc.dosje_vpc.id
  cidr_block        = "10.120.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "dosje-private-app-1"
  }
}

resource "aws_subnet" "private_db_subnet_1" {
  vpc_id            = aws_vpc.dosje_vpc.id
  cidr_block        = "10.120.20.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "dosje-private-postgis-1"
  }
}

resource "aws_subnet" "private_db_subnet_2" {
  vpc_id            = aws_vpc.dosje_vpc.id
  cidr_block        = "10.120.21.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "dosje-private-postgis-2"
  }
}

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "dosje-postgis-subnet-group"
  subnet_ids = [aws_subnet.private_db_subnet_1.id, aws_subnet.private_db_subnet_2.id]
}

# ------------------------------------------------------------------------------
# 2. MANAGED POSTGRESQL + POSTGIS SPATIAL DATABASE (RDS)
# ------------------------------------------------------------------------------
resource "aws_db_instance" "postgis_db" {
  identifier             = "dosje-postgis-cluster"
  allocated_storage      = 100
  max_allocated_storage  = 500
  engine                 = "postgres"
  engine_version         = "15.3"
  instance_class         = "db.t4g.xlarge"
  db_name                = "dosje_monitoring"
  username               = "dosje_admin"
  password               = "GovSecurePostgisPassword2026#"
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  storage_encrypted      = true
  multi_az               = true
  skip_final_snapshot    = false
  final_snapshot_identifier = "dosje-postgis-final-backup"

  tags = {
    Project  = "SIH26095"
    Database = "PostGIS-Spatial"
  }
}

# ------------------------------------------------------------------------------
# 3. ENCRYPTED EVIDENCE STORAGE BUCKET (AES-256 SSE)
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "evidence_storage" {
  bucket = "dosje-sih26095-inspection-evidence-vault"

  tags = {
    Security = "AES256-Encrypted-Evidence"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "evidence_encryption" {
  bucket = aws_s3_bucket.evidence_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "block_public" {
  bucket = aws_s3_bucket.evidence_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------------------------
# 4. EKS / ECS CLUSTER (BACKEND DRF, WEBRTC & TENSORFLOW WORKERS)
# ------------------------------------------------------------------------------
resource "aws_ecs_cluster" "app_cluster" {
  name = "dosje-inspection-platform-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ------------------------------------------------------------------------------
# 5. WEBRTC STUN/TURN RELAY SECURITY GROUP
# ------------------------------------------------------------------------------
resource "aws_security_group" "webrtc_turn_sg" {
  name        = "dosje-webrtc-turn-sg"
  description = "Allows secure UDP/TCP traffic for remote spot-check video calls"
  vpc_id      = aws_vpc.dosje_vpc.id

  ingress {
    description = "STUN/TURN Port"
    from_port   = 3478
    to_port     = 3478
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "WebRTC Media UDP Port Range"
    from_port   = 49152
    to_port     = 65535
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
