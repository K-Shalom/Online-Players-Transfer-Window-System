-- Fix Club-User Relationship
-- This script links existing clubs to their user accounts

-- First, let's see current data
SELECT 'Current Clubs:' as info;
SELECT club_id, club_name, user_id, status FROM clubs;

SELECT 'Current Users:' as info;
SELECT user_id, name, email, role FROM users;

-- Update Arsenal club to link with Shimo user
-- Assuming Shimo@gmail.com user exists
UPDATE clubs 
SET user_id = (SELECT user_id FROM users WHERE email = 'Shimo@gmail.com' LIMIT 1)
WHERE club_name = 'Arsenal' AND user_id IS NULL;

-- If you want to create a user for Man City club
-- First check if user exists, if not, create one
INSERT INTO users (name, email, password, role, status)
SELECT 'Man City Manager', 'mancity@gmail.com', '12345', 'club', 'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mancity@gmail.com');

-- Link Man City to its user
UPDATE clubs 
SET user_id = (SELECT user_id FROM users WHERE email = 'mancity@gmail.com' LIMIT 1)
WHERE club_name = 'Man City' AND user_id IS NULL;

-- Verify the changes
SELECT 'Updated Clubs with Users:' as info;
SELECT c.club_id, c.club_name, c.user_id, u.name as user_name, u.email, c.status
FROM clubs c
LEFT JOIN users u ON c.club_id = u.user_id;
