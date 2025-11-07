<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

// Debug logging (remove in production)
error_log("Login attempt - Email: " . $username);

if (!$username || !$password) {
    echo json_encode(["success"=>false,"message"=>"Username and password required"]);
    exit;
}

// Query using email field from users table
$stmt = $conn->prepare("SELECT user_id, name, email, password, role, status FROM users WHERE email=?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode(["success"=>false,"message"=>"Invalid credentials"]);
    exit;
}

// Check if account is active
if ($row['status'] !== 'active') {
    echo json_encode(["success"=>false,"message"=>"Account is inactive"]);
    exit;
}

// Check password (plain text comparison for now - matching your SQL data)
// Note: In production, passwords should be hashed using password_hash()
if ($password === $row['password']) {
    echo json_encode([
        "success"=>true,
        "user_id"=>$row['user_id'],
        "name"=>$row['name'],
        "email"=>$row['email'],
        "role"=>$row['role']
    ]);
} else {
    echo json_encode(["success"=>false,"message"=>"Invalid credentials"]);
}
?>
