<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$table = trim($data['table'] ?? '');
$ids = $data['ids'] ?? [];
$id_column = trim($data['id_column'] ?? '');

if (!$table || empty($ids) || !$id_column) {
    echo json_encode(["success" => false, "message" => "Table, IDs, and ID column are required"]);
    exit;
}

// Whitelist allowed tables for security
$allowed_tables = ['players', 'clubs', 'transfers', 'offers', 'wishlists'];
if (!in_array($table, $allowed_tables)) {
    echo json_encode(["success" => false, "message" => "Invalid table"]);
    exit;
}

// Validate IDs are integers
$ids = array_filter($ids, 'is_numeric');
if (empty($ids)) {
    echo json_encode(["success" => false, "message" => "No valid IDs provided"]);
    exit;
}

// Create placeholders for prepared statement
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$sql = "DELETE FROM $table WHERE $id_column IN ($placeholders)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Failed to prepare statement"]);
    exit;
}

// Bind parameters dynamically
$types = str_repeat('i', count($ids));
$stmt->bind_param($types, ...$ids);

if ($stmt->execute()) {
    $affected_rows = $stmt->affected_rows;
    echo json_encode([
        "success" => true,
        "message" => "$affected_rows record(s) deleted successfully",
        "deleted_count" => $affected_rows
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to delete records: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
