<?php
include 'config.php';

// 1. Ensure table exists
function ensure_table_exists($conn) {
    echo "Checking table...\n";
    $check = $conn->query("SHOW TABLES LIKE 'transfer_windows'");
    if (!$check || $check->num_rows === 0) {
        echo "Creating table...\n";
        $sql = "CREATE TABLE IF NOT EXISTS transfer_windows (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            start_at DATETIME NOT NULL,
            end_at DATETIME NOT NULL,
            is_open TINYINT(1) DEFAULT 0,
            created_by INT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
        if ($conn->query($sql)) {
            echo "Table created.\n";
        } else {
            echo "Error creating table: " . $conn->error . "\n";
        }
    } else {
        echo "Table exists.\n";
    }
}

ensure_table_exists($conn);

// 2. Test Insertion
$start_at = date('Y-m-d H:i:s');
$end_at = date('Y-m-d H:i:s', strtotime('+1 day'));
$is_open = 1;
$created_by = null; // Test with NULL

echo "Attempting insert with NULL created_by...\n";

$stmt = $conn->prepare("INSERT INTO transfer_windows (start_at, end_at, is_open, created_by) VALUES (?,?,?,?)");
if (!$stmt) {
    echo "Prepare failed: " . $conn->error . "\n";
    exit;
}

// Mimic the logic in transfer_windows.php
if ($created_by === null) {
    $null = null;
    // Note: 'i' type for null might be the issue
    $bind = $stmt->bind_param("ssii", $start_at, $end_at, $is_open, $null);
} else {
    $bind = $stmt->bind_param("ssii", $start_at, $end_at, $is_open, $created_by);
}

if (!$bind) {
    echo "Bind failed: " . $stmt->error . "\n";
}

if ($stmt->execute()) {
    echo "Insert successful. ID: " . $conn->insert_id . "\n";
} else {
    echo "Execute failed: " . $stmt->error . "\n";
}

// 3. Test with integer created_by
$created_by = 1;
echo "Attempting insert with INT created_by...\n";
$stmt = $conn->prepare("INSERT INTO transfer_windows (start_at, end_at, is_open, created_by) VALUES (?,?,?,?)");
$stmt->bind_param("ssii", $start_at, $end_at, $is_open, $created_by);
if ($stmt->execute()) {
    echo "Insert successful. ID: " . $conn->insert_id . "\n";
} else {
    echo "Execute failed: " . $stmt->error . "\n";
}

$conn->close();
?>
