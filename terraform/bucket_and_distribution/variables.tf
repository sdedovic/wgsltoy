variable "project" {
  type        = string
  description = "project name for metadata and resource tagging"
  nullable    = false
}

variable "bucket_name" {
  type        = string
  description = "name for provisioned bucket"
  nullable    = false
}

variable "default_root_object" {
  type        = string
  description = "Default root object for CloudFront, e.g. 'index.html'"
  nullable    = true
  default     = null
}

variable "custom_error_responses" {
  type = list(object({
    error_code = number
    path       = string
  }))
  description = "List of custom CloudFront error responses"
  nullable    = true
  default     = []
}


variable "custom_acm_certificate_arn" {
  type        = string
  description = "Custom ARN of ACM certificate to use for custom domain TLS"
  nullable    = true
  default     = null
}

variable "aliases" {
  type        = list(string)
  description = "List of custom domain aliases for CloudFront"
  nullable    = false
  default     = []
}
