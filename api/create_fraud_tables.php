<?php
/**
 * Create fraud detection tables
 * Run this file once to add fraud detection support
 */

header("Content-Type: text/html; charset=UTF-8");
include 'config.php';

echo "<!DOCTYPE html>
<html>
<head>
    <title>Create Fraud Detection Tables</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; margin: 10px 0; }
        .error { color: red; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin: 10px 0; }
        .info { color: blue; padding: 10px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; margin: 10px 0; }
        h1 { color: #333; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        .sql { background: #f4f4f4; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>🔧 Create Fraud Detection Tables</h1>
    <p>This script will create the necessary tables for fraud detection functionality.</p>
";

$errors = [];
$success = [];

// Check if fraud_alerts table already exists
$checkQuery = "SHOW TABLES LIKE 'fraud_alerts'";
$result = $conn->query($checkQuery);

if ($result && $result->num_rows > 0) {
    echo "<div class='info'>✓ fraud_alerts table already exists. No migration needed.</div>";
} else {
    echo "<div class='info'>Creating fraud_alerts table...</div>";
    
    $sql = "CREATE TABLE fraud_alerts (
        alert_id INT AUTO_INCREMENT PRIMARY KEY,
        transfer_id INT NULL,
        player_id INT NULL,
        buyer_club_id INT NULL,
        seller_club_id INT NULL,
        risk_score INT NOT NULL DEFAULT 0,
        violations JSON NULL,
        alert_type VARCHAR(50) NOT NULL DEFAULT 'suspicious_activity',
        status ENUM('pending', 'resolved', 'false_positive') NOT NULL DEFAULT 'pending',
        reviewed_by INT NULL,
        reviewed_at DATETIME NULL,
        action_taken VARCHAR(100) NULL,
        review_notes TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_risk_score (risk_score),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
    
    if ($conn->query($sql)) {
        $success[] = "Created fraud_alerts table";
    } else {
        $errors[] = "Failed to create fraud_alerts table: " . $conn->error;
    }
}

// Add foreign key constraints if they don't exist
$checkFK = "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
           WHERE TABLE_SCHEMA = 'optw_system' AND TABLE_NAME = 'fraud_alerts' AND CONSTRAINT_TYPE = 'FOREIGN KEY'";
$fkResult = $conn->query($checkFK);

if ($fkResult && $fkResult->num_rows == 0) {
    echo "<div class='info'>Adding foreign key constraints...</div>";
    
    $fkQueries = [
        "ALTER TABLE fraud_alerts ADD CONSTRAINT fk_fraud_transfer FOREIGN KEY (transfer_id) REFERENCES transfers(transfer_id) ON DELETE SET NULL",
        "ALTER TABLE fraud_alerts ADD CONSTRAINT fk_fraud_player FOREIGN KEY (player_id) REFERENCES players(player_id) ON DELETE SET NULL",
        "ALTER TABLE fraud_alerts ADD CONSTRAINT fk_fraud_buyer_club FOREIGN KEY (buyer_club_id) REFERENCES clubs(club_id) ON DELETE SET NULL",
        "ALTER TABLE fraud_alerts ADD CONSTRAINT fk_fraud_seller_club FOREIGN KEY (seller_club_id) REFERENCES clubs(club_id) ON DELETE SET NULL",
        "ALTER TABLE fraud_alerts ADD CONSTRAINT fk_fraud_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL"
    ];
    
    foreach ($fkQueries as $query) {
        if (!$conn->query($query)) {
            $errors[] = "Failed to add foreign key: " . $conn->error;
        }
    }
    
    if (empty($errors)) {
        $success[] = "Added foreign key constraints";
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
echo "<h2>📋 Current Fraud Alerts Table Structure</h2>";
$columnsQuery = "SHOW COLUMNS FROM fraud_alerts";
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
        echo "<tr>
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
    <h2>🎯 Fraud Detection Features</h2>
    <ul>
        <li><strong>Duplicate Player Detection:</strong> Identifies similar player profiles</li>
        <li><strong>Inflated Value Detection:</strong> Flags suspiciously high transfer offers</li>
        <li><strong>Multiple Bids Analysis:</strong> Detects unusual bidding patterns</li>
        <li><strong>Rapid Transfer Detection:</strong> Flags high-frequency transfer activity</li>
        <li><strong>Unusual Timing Detection:</strong> Monitors activity during odd hours</li>
        <li><strong>Risk Scoring:</strong> Calculates overall fraud risk score</li>
        <li><strong>Admin Notifications:</strong> Alerts administrators of high-risk activities</li>
    </ul>
    
    <h2>🎯 Next Steps</h2>
    <ol>
        <li>Test fraud detection by creating suspicious offers</li>
        <li>Review fraud alerts in admin dashboard</li>
        <li>Configure email notifications for high-risk alerts</li>
        <li>Set up automated review processes</li>
    </ol>
    
    <div class='info' style='margin-top: 30px;'>
        <strong>Note:</strong> You can safely delete this file (<code>create_fraud_tables.php</code>) after the migration is complete.
    </div>
</body>
</html>";

$conn->close();
?>
