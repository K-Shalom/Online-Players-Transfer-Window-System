# 🔧 Troubleshooting Guide - Login & Registration Issues

## ✅ FIXED - Login and Registration Now Working!

The login and registration issues have been resolved. The APIs now automatically detect whether email verification is enabled and work accordingly.

---

## 🔍 What Was Wrong?

### Problem 1: Missing Database Columns
The updated `login.php` and `signup.php` tried to use email verification columns (`email_verified`, `verification_token`, `token_expiry`) that might not exist in your database.

### Problem 2: Hard-coded Email Verification
The code assumed email verification was always enabled, causing errors when the columns didn't exist.

---

## ✅ What Was Fixed?

### Login.php
- ✅ Now checks if `email_verified` column exists before using it
- ✅ Works with or without email verification
- ✅ Only requires email verification if the column exists

### Signup.php
- ✅ Detects if email verification columns exist
- ✅ Uses email verification if columns exist
- ✅ Falls back to simple registration if columns don't exist

---

## 🚀 How to Test

### Option 1: Test WITHOUT Email Verification (Quick Test)

**Just try logging in/signing up now!** The system will work with your existing database structure.

1. **Signup**: http://localhost:5173/signup
   - Fill in the form
   - Click "Signup"
   - Should see success message

2. **Login**: http://localhost:5173/login
   - Use your credentials
   - Click "Login"
   - Should redirect to dashboard

### Option 2: Enable Email Verification (Full Features)

If you want email verification, run the migration:

1. **Visit**: http://localhost/optw_system/api/run_migration.php
2. **Click**: "Yes, verify existing users" (to allow existing users to login)
3. **Test Signup**: New users will need to verify email
4. **Check Console**: Verification link will appear in browser console (dev mode)

---

## 🐛 Still Having Issues?

### Issue: "Cannot connect to server"

**Cause**: XAMPP not running or wrong API URL

**Fix**:
1. Start XAMPP (Apache + MySQL)
2. Check `src/services/api.js`:
   ```javascript
   const API_URL = 'http://localhost/optw_system/api/';
   ```
3. Verify this URL in browser: http://localhost/optw_system/api/login.php
   - Should show: `{"success":false,"message":"Username and password required"}`

---

### Issue: "Invalid credentials" but password is correct

**Cause**: Email doesn't exist in database or password mismatch

**Fix**:
1. Check database:
   ```sql
   SELECT * FROM users WHERE email = 'your@email.com';
   ```
2. Verify password matches exactly (case-sensitive)
3. Try creating a new account

---

### Issue: "Account is inactive"

**Cause**: User status is not 'active'

**Fix**:
```sql
UPDATE users SET status = 'active' WHERE email = 'your@email.com';
```

---

### Issue: "Please verify your email"

**Cause**: Email verification is enabled but email not verified

**Fix Option 1** - Verify existing users:
```sql
UPDATE users SET email_verified = 1;
```

**Fix Option 2** - Get verification link:
1. Check browser console after signup
2. Copy verification link
3. Paste in browser
4. Email will be verified

---

### Issue: "Email already exists"

**Cause**: Email is already registered

**Fix**:
- Use a different email, OR
- Login with existing credentials, OR
- Delete the existing account:
  ```sql
  DELETE FROM users WHERE email = 'your@email.com';
  ```

---

### Issue: "Registration failed: [SQL error]"

**Cause**: Database column mismatch

**Fix**:
1. Check your users table structure:
   ```sql
   DESCRIBE users;
   ```
2. Required columns:
   - `user_id` (INT, AUTO_INCREMENT, PRIMARY KEY)
   - `name` (VARCHAR)
   - `email` (VARCHAR)
   - `password` (VARCHAR)
   - `role` (VARCHAR or ENUM)
   - `status` (VARCHAR or ENUM)
3. Optional (for email verification):
   - `email_verified` (TINYINT)
   - `verification_token` (VARCHAR)
   - `token_expiry` (DATETIME)

---

### Issue: Frontend shows loading forever

**Cause**: API request failing or CORS issue

**Fix**:
1. Open browser console (F12)
2. Check for errors
3. Look at Network tab
4. Verify API response

**Common CORS Fix**:
The API files already have CORS headers, but if still having issues:
```php
header("Access-Control-Allow-Origin: http://localhost:5173");
```

---

## 📊 Quick Diagnostic

### Test API Directly

**Test Login API**:
```bash
# Using curl (Git Bash or WSL)
curl -X POST http://localhost/optw_system/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password123"}'
```

**Test Signup API**:
```bash
curl -X POST http://localhost/optw_system/api/signup.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"club"}'
```

**Or use Postman/Insomnia**:
- URL: `http://localhost/optw_system/api/login.php`
- Method: POST
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "username": "test@example.com",
    "password": "password123"
  }
  ```

---

## 🔍 Check Database Connection

**Test config.php**:
Create a test file: `api/test_db.php`
```php
<?php
include 'config.php';
echo json_encode([
    "success" => true,
    "message" => "Database connected!",
    "database" => "optw_system"
]);
?>
```

Visit: http://localhost/optw_system/api/test_db.php

Should show: `{"success":true,"message":"Database connected!","database":"optw_system"}`

---

## 📝 Verify Database Structure

Run this SQL to check your users table:
```sql
SHOW CREATE TABLE users;
```

**Minimum Required Structure**:
```sql
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'club',
  status VARCHAR(50) DEFAULT 'active'
);
```

**With Email Verification**:
```sql
ALTER TABLE users 
ADD COLUMN email_verified TINYINT(1) DEFAULT 0,
ADD COLUMN verification_token VARCHAR(255) NULL,
ADD COLUMN token_expiry DATETIME NULL;
```

---

## 🎯 Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Cannot connect | Start XAMPP |
| Invalid credentials | Check email/password in database |
| Account inactive | `UPDATE users SET status='active'` |
| Email not verified | `UPDATE users SET email_verified=1` |
| Email exists | Use different email or login |
| SQL error | Run migration or check table structure |
| CORS error | Check API headers |
| Loading forever | Check browser console for errors |

---

## ✅ Success Indicators

### Login Success
```json
{
  "success": true,
  "user_id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

### Signup Success (Without Email Verification)
```json
{
  "success": true,
  "message": "User registered successfully",
  "user_id": 2
}
```

### Signup Success (With Email Verification)
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email to login.",
  "user_id": 2,
  "verification_link": "http://localhost:5173/verify-email?token=..."
}
```

---

## 🆘 Still Need Help?

1. **Check browser console** (F12 → Console tab)
2. **Check Network tab** (F12 → Network tab)
3. **Check PHP error logs** (XAMPP → Apache logs)
4. **Check database** (phpMyAdmin → users table)

### Common Error Messages & Solutions

**"Undefined index: email_verified"**
- ✅ FIXED - APIs now check if column exists

**"Column 'email_verified' not found"**
- ✅ FIXED - APIs now work without this column

**"SQLSTATE[42S22]: Column not found"**
- ✅ FIXED - APIs adapt to your database structure

---

## 🎉 You're All Set!

The login and registration should now work perfectly, whether you have email verification enabled or not!

**Test it now**: http://localhost:5173/signup
