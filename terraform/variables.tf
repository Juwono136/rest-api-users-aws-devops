# variables.tf

variable "aws_region" {
  description = "AWS Region for deployment."
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Main project name."
  type        = string
  default     = "restapi-users"
}

variable "environment" {
  description = "Deployment environment (e.g., staging, production)."
  type        = string
  default     = "staging"
}

variable "cluster_name" {
  description = "EKS cluster name."
  type        = string
  default     = "restapi-users-cluster"
}

variable "ecr_repository_name" {
  description = "ECR repository name."
  type        = string
  default     = "restapi-users"
}

variable "terraform_admin_role_arn" {
  description = "The ARN of the IAM Role used to manage infrastructure via Terraform."
  type        = string
}