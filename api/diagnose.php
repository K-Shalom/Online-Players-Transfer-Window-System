<?php
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html>
<head>
    <title>OPTW System Diagnostics</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #1976d2; color: white; }
        .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        h2 { color: #1976d2; }
    </style>
</head>
<body>
    <h1>🔍 OPTW System Diagnostics</h1>
    <p>Complete system check - <?php echo date('Y-m-d H:i:s'); ?></p>

<?php
include 'config.php';

// Test 1: PHP Version
echo '<div class="section">';
echo '<h2>1. PHP Environment</h2>';
echo '<p><strong>PHP Version:</strong> ' . phpversion();
if (version_compare(phpversion(), '7.4.0', '>=')) {
    echo ' <span class="success">✅ OK</span></p>';
} else {
    echo ' <span class="error">❌ Too old (need 7.4+)</span></p>';
}
echo '<p><strong>Server:</strong> ' . $_SERVER['SERVER_SOFTWARE'] . '</p>';
echo '</div>';

// Test 2: Database Connection
echo '<div class="section">';
echo '<h2>2. Database Connection</h2>';
if ($conn->connect_error) {
    echo '<p class="error">❌ Connection Failed: ' . $conn->connect_error . '</p>';
} else {
    echo '<p class="success">✅ Connected to MySQL successfully</p>';
    echo '<p><strong>Database:</strong> ' . $dbname . '</p>';
    echo '<p><strong>Host:</strong> ' . $host . '</p>';
}
echo '</div>';

// Test 3: Check tables
echo '<div class="section">';
echo '<h2>3. Database Tables</h2>';
$tables = ['users', 'clubs', 'players', 'transfers'];
echo '<table>';
echo '<tr><th>Table</th><th>Status</th><th>Row Count</th></tr>';
foreach ($tables as $table) {
    $result = $conn->query("SELECT COUNT(*) as count FROM $table");
    if ($result) {
        $row = $result->fetch_assoc();
        echo '<tr><td>' . $table . '</td><td class="success">✅ Exists</td><td>' . $row['count'] . '</td></tr>';
    } else {
        echo '<tr><td>' . $table . '</td><td class="error">❌ Missing</td><td>-</td></tr>';
    }
}
echo '</table>';
echo '</div>';

// Test 4: Check users table structure
echo '<div class="section">';
echo '<h2>4. Users Table Structure</h2>';
$result = $conn->query("DESCRIBE users");
if ($result) {
    echo '<table>';
    echo '<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th></tr>';
    while ($row = $result->fetch_assoc()) {
        echo '<tr>';
        echo '<td>' . $row['Field'] . '</td>';
        echo '<td>' . $row['Type'] . '</td>';
        echo '<td>' . $row['Null'] . '</td>';
        echo '<td>' . $row['Key'] . '</td>';
        echo '</tr>';
    }
    echo '</table>';
} else {
    echo '<p class="error">❌ Cannot read table structure</p>';
}
echo '</div>';

// Test 5: List all users
echo '<div class="section">';
echo '<h2>5. Existing Users</h2>';
$result = $conn->query("SELECT user_id, name, email, role, status FROM users");
if ($result && $result->num_rows > 0) {
    echo '<table>';
    echo '<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr>';
    while ($row = $result->fetch_assoc()) {
        $statusClass = $row['status'] === 'active' ? 'success' : 'warning';
        echo '<tr>';
        echo '<td>' . $row['user_id'] . '</td>';
        echo '<td>' . $row['name'] . '</td>';
        echo '<td>' . $row['email'] . '</td>';
        echo '<td>' . $row['role'] . '</td>';
        echo '<td class="' . $statusClass . '">' . $row['status'] . '</td>';
        echo '</tr>';
    }
    echo '</table>';
} else {
    echo '<p class="error">❌ No users found in database!</p>';
    echo '<p><strong>Solution:</strong> Import optw_system.sql file</p>';
}
echo '</div>';

// Test 6: Test login credentials
echo '<div class="section">';
echo '<h2>6. Test Login Credentials</h2>';
$test_email = 'shalom@gmail.com';
$test_password = '12345';

$stmt = $conn->prepare("SELECT user_id, name, email, password, role, status FROM users WHERE email=?");
$stmt->bind_param("s", $test_email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if ($user) {
    echo '<p class="success">✅ User found: ' . $user['name'] . '</p>';
    echo '<table>';
    echo '<tr><th>Field</th><th>Value</th><th>Status</th></tr>';
    echo '<tr><td>Email</td><td>' . $user['email'] . '</td><td class="success">✅</td></tr>';
    echo '<tr><td>Password in DB</td><td>' . $user['password'] . '</td><td>';
    if ($test_password === $user['password']) {
        echo '<span class="success">✅ Matches</span>';
    } else {
        echo '<span class="error">❌ Does NOT match (Expected: ' . $test_password . ')</span>';
    }
    echo '</td></tr>';
    echo '<tr><td>Role</td><td>' . $user['role'] . '</td><td class="success">✅</td></tr>';
    echo '<tr><td>Status</td><td>' . $user['status'] . '</td><td>';
    if ($user['status'] === 'active') {
        echo '<span class="success">✅ Active</span>';
    } else {
        echo '<span class="error">❌ Inactive</span>';
    }
    echo '</td></tr>';
    echo '</table>';
} else {
    echo '<p class="error">❌ User not found with email: ' . $test_email . '</p>';
    echo '<p><strong>Solution:</strong> Run this SQL:</p>';
    echo '<pre>INSERT INTO users (name, email, password, role, status) VALUES (\'shalom\', \'shalom@gmail.com\', \'12345\', \'admin\', \'active\');</pre>';
}
echo '</div>';

// Test 7: API Files
echo '<div class="section">';
echo '<h2>7. API Files Check</h2>';
$api_files = ['login.php', 'signup.php', 'config.php', 'dashboard_stats.php', 'players.php', 'clubs.php', 'transfers.php'];
echo '<table>';
echo '<tr><th>File</th><th>Status</th><th>Size</th></tr>';
foreach ($api_files as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        $size = filesize($path);
        echo '<tr><td>' . $file . '</td><td class="success">✅ Exists</td><td>' . $size . ' bytes</td></tr>';
    } else {
        echo '<tr><td>' . $file . '</td><td class="error">❌ Missing</td><td>-</td></tr>';
    }
}
echo '</table>';
echo '</div>';

// Test 8: CORS Headers
echo '<div class="section">';
echo '<h2>8. CORS Configuration</h2>';
$login_file = file_get_contents(__DIR__ . '/login.php');
if (strpos($login_file, 'Access-Control-Allow-Origin') !== false) {
    echo '<p class="success">✅ CORS headers found in login.php</p>';
} else {
    echo '<p class="error">❌ CORS headers missing in login.php</p>';
}
echo '</div>';

// Test 9: Frontend URL
echo '<div class="section">';
echo '<h2>9. Frontend Access</h2>';
echo '<p><strong>React App URL:</strong> <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></p>';
echo '<p><strong>Login Page:</strong> <a href="http://localhost:3000/login" target="_blank">http://localhost:3000/login</a></p>';
echo '<p><strong>Test Page:</strong> <a href="http://localhost/optw_system/test_simple.html" target="_blank">test_simple.html</a></p>';
echo '</div>';

// Summary
echo '<div class="section" style="background: #e3f2fd;">';
echo '<h2>📋 Summary</h2>';
$all_good = true;

if (!$conn->connect_error && $user && $user['status'] === 'active' && $test_password === $user['password']) {
    echo '<h3 class="success">✅ System is ready!</h3>';
    echo '<p><strong>You can now login with:</strong></p>';
    echo '<ul>';
    echo '<li>Email: shalom@gmail.com</li>';
    echo '<li>Password: 12345</li>';
    echo '</ul>';
    echo '<p><strong>Next steps:</strong></p>';
    echo '<ol>';
    echo '<li>Make sure React app is running (npm start)</li>';
    echo '<li>Go to <a href="http://localhost:3000/login">http://localhost:3000/login</a></li>';
    echo '<li>Enter credentials and login</li>';
    echo '</ol>';
} else {
    echo '<h3 class="error">❌ Issues found</h3>';
    echo '<p>Please fix the errors above before trying to login.</p>';
}
echo '</div>';

$conn->close();
?>

</body>
</html>
