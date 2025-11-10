-- Add email verification columns to users table
-- Run this script to add email verification functionality

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 0 AFTER email,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL AFTER email_verified,
ADD COLUMN IF NOT EXISTS token_expiry DATETIME NULL AFTER verification_token;

-- Update existing users to have verified emails (optional - for existing data)
-- Comment out the line below if you want existing users to verify their emails
UPDATE users SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_token);
