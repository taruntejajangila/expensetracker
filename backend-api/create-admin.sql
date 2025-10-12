-- Create Admin User
-- Email: admin@expensetracker.com
-- Password: admin123 (bcrypt hash)

INSERT INTO users (email, password, first_name, last_name, is_verified, is_active) 
VALUES (
  'admin@expensetracker.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4Z9W2XvK6u',
  'Admin',
  'User',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Verify admin user was created
SELECT id, email, first_name, last_name, is_verified, is_active, created_at 
FROM users 
WHERE email = 'admin@expensetracker.com';

