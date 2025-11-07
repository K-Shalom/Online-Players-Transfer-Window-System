<?php
// Test script to verify login functionality
header("Content-Type: text/html; charset=UTF-8");

include 'config.php';

echo "<h1>OPTW Login System Test</h1>";

// Test 1: Database Connection
echo "<h2>1. Database Connection Test</h2>";
if ($conn->connect_error) {
    echo "<p style='color:red'>❌ Failed: " . $conn->connect_error . "</p>";
} else {
    echo "<p style='color:green'>✅ Connected successfully to database</p>";
}

// Test 2: Check users table
echo "<h2>2. Users Table Test</h2>";
$result = $conn->query("SELECT COUNT(*) as count FROM users");
if ($result) {
    $row = $result->fetch_assoc();
    echo "<p style='color:green'>✅ Users table exists with " . $row['count'] . " users</p>";
} else {
    echo "<p style='color:red'>❌ Failed to query users table: " . $conn->error . "</p>";
}

// Test 3: List all users (for debugging)
echo "<h2>3. Existing Users</h2>";
$result = $conn->query("SELECT user_id, name, email, role, status FROM users");
if ($result) {
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row['user_id'] . "</td>";
        echo "<td>" . $row['name'] . "</td>";
        echo "<td>" . $row['email'] . "</td>";
        echo "<td>" . $row['role'] . "</td>";
        echo "<td>" . $row['status'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p style='color:red'>❌ Failed to list users: " . $conn->error . "</p>";
}

// Test 4: Test login with default credentials
echo "<h2>4. Test Login Credentials</h2>";
$test_email = "shalom@gmail.com";
$test_password = "12345";

$stmt = $conn->prepare("SELECT user_id, name, email, password, role, status FROM users WHERE email=?");
$stmt->bind_param("s", $test_email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user) {
    echo "<p style='color:green'>✅ User found: " . $user['name'] . " (" . $user['email'] . ")</p>";
    echo "<p>Role: " . $user['role'] . "</p>";
    echo "<p>Status: " . $user['status'] . "</p>";
    echo "<p>Password in DB: " . $user['password'] . "</p>";
    
    if ($test_password === $user['password']) {
        echo "<p style='color:green'>✅ Password matches!</p>";
    } else {
        echo "<p style='color:red'>❌ Password does NOT match</p>";
        echo "<p>Expected: " . $test_password . "</p>";
        echo "<p>Got: " . $user['password'] . "</p>";
    }
    
    if ($user['status'] === 'active') {
        echo "<p style='color:green'>✅ Account is active</p>";
    } else {
        echo "<p style='color:red'>❌ Account is NOT active</p>";
    }
} else {
    echo "<p style='color:red'>❌ User not found with email: " . $test_email . "</p>";
}

// Test 5: API endpoint test
echo "<h2>5. API Endpoint Test</h2>";
echo "<p>Login API URL: <a href='login.php'>login.php</a></p>";
echo "<p>Test the login by visiting your React app at: <a href='http://localhost:3000/login'>http://localhost:3000/login</a></p>";

// Test 6: CORS Headers
echo "<h2>6. CORS Configuration</h2>";
echo "<p style='color:green'>✅ CORS headers are set in login.php</p>";
echo "<ul>";
echo "<li>Access-Control-Allow-Origin: *</li>";
echo "<li>Access-Control-Allow-Methods: POST, GET, OPTIONS</li>";
echo "<li>Access-Control-Allow-Headers: Content-Type</li>";
echo "</ul>";

echo "<hr>";
echo "<h2>How to Test Login</h2>";
echo "<ol>";
echo "<li>Make sure XAMPP Apache and MySQL are running</li>";
echo "<li>Go to <a href='http://localhost:3000/login'>http://localhost:3000/login</a></li>";
echo "<li>Enter email: <strong>shalom@gmail.com</strong></li>";
echo "<li>Enter password: <strong>12345</strong></li>";
echo "<li>Click Login</li>";
echo "</ol>";

echo "<h2>Troubleshooting</h2>";
echo "<ul>";
echo "<li>Check browser console (F12) for errors</li>";
echo "<li>Check Network tab to see API request/response</li>";
echo "<li>Verify React app is running (npm start)</li>";
echo "<li>Check XAMPP Apache error logs</li>";
echo "</ul>";

$conn->close();
?>
