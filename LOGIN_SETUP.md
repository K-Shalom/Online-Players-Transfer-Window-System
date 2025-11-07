# Login & Signup System Setup Guide

## Database Setup
1. Import the SQL file into your MySQL database:
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create database named `optw_system` if not exists
   - Import `optw_system.sql` file

## Test Credentials
Based on your SQL file, you can login with:
- **Email:** shalom@gmail.com
- **Password:** 12345
- **Role:** admin

## How the Login Works

### Backend (PHP)
- **File:** `api/login.php`
- **Database:** Uses `users` table with columns: `user_id`, `name`, `email`, `password`, `role`, `status`
- **Authentication:** Queries by email field and checks password
- **Response:** Returns user data including `user_id`, `name`, `email`, `role`

### Frontend (React)
- **File:** `src/pages/Login.jsx`
- **Input:** Email and password
- **Storage:** Saves user data to localStorage
- **Redirect:** 
  - Admin users → `/` (admin dashboard)
  - Club users → `/dashboard` (club dashboard)

## API Endpoint
- **URL:** http://localhost/optw_system/api/login.php
- **Method:** POST
- **Body:** 
```json
{
  "username": "shalom@gmail.com",
  "password": "12345"
}
```

## Testing Steps
1. Start XAMPP (Apache and MySQL)
2. Make sure the database is imported
3. Start your React app: `npm start`
4. Navigate to login page
5. Enter email: shalom@gmail.com
6. Enter password: 12345
7. Click Login

## Security Note
⚠️ **Important:** The current implementation uses plain text password comparison for testing. In production, you should:
1. Hash passwords using `password_hash()` in PHP
2. Update existing passwords in database to hashed versions
3. Use `password_verify()` for authentication

## Signup System

### Backend (PHP)
- **File:** `api/signup.php`
- **Fields:** name, email, password, role (default: 'club')
- **Validation:** 
  - Email format validation
  - Password minimum 6 characters
  - Check for duplicate emails
- **Response:** Returns success status and new user_id

### Frontend (React)
- **File:** `src/pages/Signup.jsx`
- **Fields:** Name, Email, Password, Role (admin/club)
- **Redirect:** After successful signup, redirects to login page

### API Endpoint
- **URL:** http://localhost/optw_system/api/signup.php
- **Method:** POST
- **Body:** 
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "club"
}
```

## Adding New Users
You can add users either through:
1. **Signup page** in the application
2. **Direct SQL insert:**
```sql
INSERT INTO users (name, email, password, role, status) 
VALUES ('User Name', 'user@email.com', '12345', 'club', 'active');
```

For production with hashed passwords:
```sql
INSERT INTO users (name, email, password, role, status) 
VALUES ('User Name', 'user@email.com', '$2y$10$...hashed_password...', 'club', 'active');
```
