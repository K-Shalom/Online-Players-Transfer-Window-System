<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? 'club'); // default to club role

if (!$name || !$email || !$password) {
    echo json_encode(["success"=>false,"message"=>"Name, email and password are required"]);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success"=>false,"message"=>"Invalid email format"]);
    exit;
}

// Validate password length
if (strlen($password) < 6) {
    echo json_encode(["success"=>false,"message"=>"Password must be at least 6 characters"]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT user_id FROM users WHERE email=?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["success"=>false,"message"=>"Email already exists"]);
    exit;
}

// Check if email_verified column exists
$columnsQuery = "SHOW COLUMNS FROM users LIKE 'email_verified'";
$columnsResult = $conn->query($columnsQuery);
$hasEmailVerification = ($columnsResult && $columnsResult->num_rows > 0);

$status = 'active';

if ($hasEmailVerification) {
    // Email verification is enabled
    $verification_token = bin2hex(random_bytes(32));
    $token_expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    $email_verified = 0; // Not verified by default
    
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, status, email_verified, verification_token, token_expiry) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->bind_param("ssssiiss", $name, $email, $password, $role, $status, $email_verified, $verification_token, $token_expiry);
    
    if ($stmt->execute()) {
        $user_id = $conn->insert_id;
        $verification_link = "http://localhost:5173/verify-email?token=" . $verification_token;
        
        echo json_encode([
            "success"=>true,
            "message"=>"User registered successfully. Please verify your email to login.",
            "user_id"=>$user_id,
            "verification_link"=>$verification_link // Remove in production, send via email instead
        ]);
    } else {
        echo json_encode(["success"=>false,"message"=>"Registration failed: " . $conn->error]);
    }
} else {
    // Email verification is NOT enabled - use simple insert
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, status) VALUES (?,?,?,?,?)");
    $stmt->bind_param("sssss", $name, $email, $password, $role, $status);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success"=>true,
            "message"=>"User registered successfully",
            "user_id"=>$conn->insert_id
        ]);
    } else {
        echo json_encode(["success"=>false,"message"=>"Registration failed: " . $conn->error]);
    }
}
?>
