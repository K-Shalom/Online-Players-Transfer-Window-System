<?php
/**
 * Database Migration Runner
 * Run this file once to add email verification support
 * Access: http://localhost/optw_system/api/run_migration.php
 */

header("Content-Type: text/html; charset=UTF-8");
include 'config.php';

echo "<!DOCTYPE html>
<html>
<head>
    <title>Database Migration</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; margin: 10px 0; }
        .error { color: red; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0; }
        .info { color: blue; padding: 10px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; margin: 10px 0; }
        h1 { color: #333; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>🔧 Database Migration - Email Verification</h1>
    <p>This script will add email verification columns to the users table.</p>
";

$errors = [];
$success = [];

// Check if columns already exist
$checkQuery = "SHOW COLUMNS FROM users LIKE 'email_verified'";
$result = $conn->query($checkQuery);

if ($result && $result->num_rows > 0) {
    echo "<div class='info'>✓ Email verification columns already exist. No migration needed.</div>";
} else {
    echo "<div class='info'>Adding email verification columns...</div>";
    
    // Add email_verified column
    $sql1 = "ALTER TABLE users ADD COLUMN email_verified TINYINT(1) DEFAULT 0 AFTER email";
    if ($conn->query($sql1)) {
        $success[] = "Added 'email_verified' column";
    } else {
        $errors[] = "Failed to add 'email_verified' column: " . $conn->error;
    }
    
    // Add verification_token column
    $sql2 = "ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL AFTER email_verified";
    if ($conn->query($sql2)) {
        $success[] = "Added 'verification_token' column";
    } else {
        $errors[] = "Failed to add 'verification_token' column: " . $conn->error;
    }
    
    // Add token_expiry column
    $sql3 = "ALTER TABLE users ADD COLUMN token_expiry DATETIME NULL AFTER verification_token";
    if ($conn->query($sql3)) {
        $success[] = "Added 'token_expiry' column";
    } else {
        $errors[] = "Failed to add 'token_expiry' column: " . $conn->error;
    }
    
    // Create index
    $sql4 = "CREATE INDEX idx_verification_token ON users(verification_token)";
    if ($conn->query($sql4)) {
        $success[] = "Created index on 'verification_token'";
    } else {
        // Index might already exist, not critical
        if (strpos($conn->error, 'Duplicate key name') === false) {
            $errors[] = "Failed to create index: " . $conn->error;
        }
    }
    
    // Optional: Set existing users as verified
    echo "<div class='info'>
        <strong>Optional Step:</strong> Do you want to mark all existing users as verified?<br>
        <small>This allows existing users to login without email verification.</small><br>
        <form method='post' style='margin-top: 10px;'>
            <button type='submit' name='verify_existing' value='yes' style='padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;'>
                Yes, verify existing users
            </button>
            <button type='submit' name='verify_existing' value='no' style='padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;'>
                No, they must verify
            </button>
        </form>
    </div>";
    
    if (isset($_POST['verify_existing'])) {
        if ($_POST['verify_existing'] === 'yes') {
            $sql5 = "UPDATE users SET email_verified = 1 WHERE email_verified = 0 OR email_verified IS NULL";
            if ($conn->query($sql5)) {
                $affected = $conn->affected_rows;
                $success[] = "Marked {$affected} existing users as verified";
            } else {
                $errors[] = "Failed to update existing users: " . $conn->error;
            }
        } else {
            echo "<div class='info'>Existing users will need to verify their email addresses.</div>";
        }
    }
}

// Display results
if (!empty($success)) {
    echo "<h2>✅ Success</h2>";
    foreach ($success as $msg) {
        echo "<div class='success'>✓ {$msg}</div>";
    }
}

if (!empty($errors)) {
    echo "<h2>❌ Errors</h2>";
    foreach ($errors as $msg) {
        echo "<div class='error'>✗ {$msg}</div>";
    }
}

// Show current table structure
echo "<h2>📋 Current Users Table Structure</h2>";
$columnsQuery = "SHOW COLUMNS FROM users";
$columnsResult = $conn->query($columnsQuery);

if ($columnsResult) {
    echo "<table border='1' cellpadding='10' cellspacing='0' style='width: 100%; border-collapse: collapse;'>
        <thead>
            <tr style='background: #f8f9fa;'>
                <th>Field</th>
                <th>Type</th>
                <th>Null</th>
                <th>Key</th>
                <th>Default</th>
                <th>Extra</th>
            </tr>
        </thead>
        <tbody>";
    
    while ($row = $columnsResult->fetch_assoc()) {
        $highlight = in_array($row['Field'], ['email_verified', 'verification_token', 'token_expiry']) 
            ? "style='background: #d4edda;'" 
            : "";
        echo "<tr {$highlight}>
            <td><strong>{$row['Field']}</strong></td>
            <td>{$row['Type']}</td>
            <td>{$row['Null']}</td>
            <td>{$row['Key']}</td>
            <td>" . ($row['Default'] ?? 'NULL') . "</td>
            <td>{$row['Extra']}</td>
        </tr>";
    }
    
    echo "</tbody></table>";
}

echo "
    <h2>🎯 Next Steps</h2>
    <ol>
        <li>Verify that the highlighted columns (email_verified, verification_token, token_expiry) are present</li>
        <li>Test the signup flow: <a href='http://localhost:5173/signup' target='_blank'>Go to Signup</a></li>
        <li>Check browser console for verification link (development mode)</li>
        <li>Test email verification and login</li>
    </ol>
    
    <h2>📚 Documentation</h2>
    <ul>
        <li><a href='../FEATURES_IMPLEMENTATION.md'>Complete Features Documentation</a></li>
        <li><a href='../SETUP_INSTRUCTIONS.md'>Quick Setup Guide</a></li>
        <li><a href='../IMPLEMENTATION_SUMMARY.md'>Implementation Summary</a></li>
    </ul>
    
    <div class='info' style='margin-top: 30px;'>
        <strong>Note:</strong> You can safely delete this file (<code>run_migration.php</code>) after the migration is complete.
    </div>
</body>
</html>";

$conn->close();
?>
