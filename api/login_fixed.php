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

// Check if email_verified column exists
$columnsQuery = "SHOW COLUMNS FROM users LIKE 'email_verified'";
$columnsResult = $conn->query($columnsQuery);
$hasEmailVerification = ($columnsResult && $columnsResult->num_rows > 0);

// Query using email field from users table
if ($hasEmailVerification) {
    $stmt = $conn->prepare("SELECT user_id, name, email, password, role, status, email_verified FROM users WHERE email=?");
} else {
    $stmt = $conn->prepare("SELECT user_id, name, email, password, role, status FROM users WHERE email=?");
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode(["success"=>false,"message"=>"Invalid credentials"]);
    exit;
}

// Check if account is active
if (isset($row['status']) && $row['status'] !== 'active') {
    echo json_encode(["success"=>false,"message"=>"Account is inactive"]);
    exit;
}

// Check if email is verified (only if column exists)
if ($hasEmailVerification && isset($row['email_verified']) && $row['email_verified'] != 1) {
    echo json_encode(["success"=>false,"message"=>"Please verify your email before logging in", "email_not_verified"=>true]);
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
