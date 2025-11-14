-- Add missing columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_salt VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'User',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update role column based on role_id
UPDATE users 
SET role = CASE 
  WHEN role_id = 1 THEN 'Administrator'
  WHEN role_id = 2 THEN 'Manager'
  WHEN role_id = 3 THEN 'ADM_INV'
  ELSE 'User'
END
WHERE role IS NULL OR role = 'User';

-- Create login_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS login_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  success BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit_log(user_id);
