<?php
/**
 * Add agreement_pdf column to transfers table
 * Run this file once to add PDF agreement support
 */

header("Content-Type: text/html; charset=UTF-8");
include 'config.php';

echo "<!DOCTYPE html>
<html>
<head>
    <title>Add PDF Column Migration</title>
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
    <h1>🔧 Add PDF Column Migration</h1>
    <p>This script will add the agreement_pdf column to the transfers table.</p>
";

$errors = [];
$success = [];

// Check if column already exists
$checkQuery = "SHOW COLUMNS FROM transfers LIKE 'agreement_pdf'";
$result = $conn->query($checkQuery);

if ($result && $result->num_rows > 0) {
    echo "<div class='info'>✓ agreement_pdf column already exists. No migration needed.</div>";
} else {
    echo "<div class='info'>Adding agreement_pdf column...</div>";
    
    // Add agreement_pdf column
    $sql = "ALTER TABLE transfers ADD COLUMN agreement_pdf VARCHAR(255) NULL AFTER status";
    if ($conn->query($sql)) {
        $success[] = "Added 'agreement_pdf' column";
    } else {
        $errors[] = "Failed to add 'agreement_pdf' column: " . $conn->error;
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
echo "<h2>📋 Current Transfers Table Structure</h2>";
$columnsQuery = "SHOW COLUMNS FROM transfers";
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
        $highlight = $row['Field'] === 'agreement_pdf' 
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
        <li>Verify that the agreement_pdf column is present</li>
        <li>Test completing a transfer to see PDF generation</li>
        <li>Check the agreements/ directory for generated PDFs</li>
    </ol>
    
    <div class='info' style='margin-top: 30px;'>
        <strong>Note:</strong> You can safely delete this file (<code>add_pdf_column.php</code>) after the migration is complete.
    </div>
</body>
</html>";

$conn->close();
?>
