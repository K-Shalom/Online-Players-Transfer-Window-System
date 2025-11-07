# Login Troubleshooting Guide

## Common Login Issues and Solutions

### Issue 1: "Cannot connect to server"

**Symptoms:**
- Error message: "Cannot connect to server. Please check: 1) XAMPP is running 2) Backend URL is correct"
- No response from backend

**Solutions:**
1. **Check XAMPP is running**
   ```
   - Open XAMPP Control Panel
   - Make sure Apache is running (green)
   - Make sure MySQL is running (green)
   ```

2. **Verify backend URL**
   - Open `src/services/api.js`
   - Check `API_URL` is: `http://localhost/optw_system/api/`
   - Make sure there are no typos

3. **Test backend directly**
   - Open browser
   - Go to: `http://localhost/optw_system/api/test_login.php`
   - This will show if backend is working

### Issue 2: "Invalid credentials"

**Symptoms:**
- Error message: "Invalid credentials"
- Email and password don't match

**Solutions:**
1. **Check default credentials**
   ```
   Email: shalom@gmail.com
   Password: 12345
   ```

2. **Verify user exists in database**
   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Select database: `optw_system`
   - Click on `users` table
   - Check if user exists with correct email

3. **Check password in database**
   - In phpMyAdmin, look at the `password` column
   - Make sure it matches what you're typing
   - Password is case-sensitive

### Issue 3: "Account is inactive"

**Symptoms:**
- Error message: "Account is inactive"
- User exists but can't login

**Solution:**
1. **Activate account in database**
   ```sql
   UPDATE users 
   SET status = 'active' 
   WHERE email = 'shalom@gmail.com';
   ```

2. **Or use phpMyAdmin**
   - Go to `users` table
   - Find the user
   - Change `status` to `active`
   - Click Save

### Issue 4: CORS Errors

**Symptoms:**
- Browser console shows CORS error
- "Access-Control-Allow-Origin" error

**Solutions:**
1. **Check login.php has CORS headers**
   - File should have these headers at top:
   ```php
   header("Access-Control-Allow-Origin: *");
   header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
   header("Access-Control-Allow-Headers: Content-Type");
   ```

2. **Clear browser cache**
   - Press Ctrl+Shift+Delete
   - Clear cached files
   - Reload page

### Issue 5: Database Connection Error

**Symptoms:**
- Error about database connection
- "Connection failed" message

**Solutions:**
1. **Check config.php**
   ```php
   $host = "localhost";
   $dbname = "optw_system";
   $username = "root";
   $password = "";  // Usually empty for XAMPP
   ```

2. **Verify database exists**
   - Open phpMyAdmin
   - Check if `optw_system` database exists
   - If not, import `optw_system.sql`

3. **Check MySQL is running**
   - XAMPP Control Panel
   - MySQL should be green/running

## Testing Steps

### Step 1: Test Backend
```
1. Open: http://localhost/optw_system/api/test_login.php
2. Check all tests pass (green checkmarks)
3. Verify user exists in database
```

### Step 2: Test Frontend
```
1. Open: http://localhost:3000/login
2. Open browser console (F12)
3. Enter credentials
4. Click Login
5. Check console for errors
```

### Step 3: Check Network
```
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for login.php request
5. Check:
   - Status: Should be 200
   - Response: Should show success or error message
```

## Debug Checklist

- [ ] XAMPP Apache is running
- [ ] XAMPP MySQL is running
- [ ] Database `optw_system` exists
- [ ] User exists in `users` table
- [ ] User status is `active`
- [ ] Password matches in database
- [ ] React app is running (npm start)
- [ ] Backend URL is correct in api.js
- [ ] No CORS errors in console
- [ ] No network errors in console

## Quick Fixes

### Reset User Password
```sql
UPDATE users 
SET password = '12345' 
WHERE email = 'shalom@gmail.com';
```

### Create New Admin User
```sql
INSERT INTO users (name, email, password, role, status) 
VALUES ('Admin', 'admin@test.com', '12345', 'admin', 'active');
```

### Check All Users
```sql
SELECT user_id, name, email, role, status 
FROM users;
```

## Error Messages Explained

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Username and password required" | Empty fields | Fill both fields |
| "Invalid credentials" | Wrong email/password | Check credentials |
| "Account is inactive" | User not active | Activate in database |
| "Cannot connect to server" | Backend not running | Start XAMPP |
| "No response from server" | CORS or network issue | Check CORS headers |

## Still Not Working?

### Check PHP Error Logs
1. Open XAMPP Control Panel
2. Click "Logs" button for Apache
3. Look for PHP errors
4. Check error_log file

### Check Browser Console
1. Press F12
2. Go to Console tab
3. Look for red errors
4. Copy error message for debugging

### Test API Directly
Use this curl command:
```bash
curl -X POST http://localhost/optw_system/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"shalom@gmail.com","password":"12345"}'
```

Expected response:
```json
{
  "success": true,
  "user_id": 1,
  "name": "shalom",
  "email": "shalom@gmail.com",
  "role": "admin"
}
```

## Contact Information

If you're still having issues:
1. Check all items in Debug Checklist
2. Run test_login.php and note which tests fail
3. Check browser console for specific errors
4. Check PHP error logs
5. Verify all files are in correct locations

---

**Most common issue:** XAMPP not running or database not imported!
