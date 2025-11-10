<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'config.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    echo json_encode(["success" => false, "message" => "Verification token is required"]);
    exit;
}

// Find user with this token
$stmt = $conn->prepare("SELECT user_id, email_verified, token_expiry FROM users WHERE verification_token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(["success" => false, "message" => "Invalid verification token"]);
    exit;
}

if ($user['email_verified'] == 1) {
    echo json_encode(["success" => false, "message" => "Email already verified"]);
    exit;
}

// Check if token has expired
if (strtotime($user['token_expiry']) < time()) {
    echo json_encode(["success" => false, "message" => "Verification token has expired"]);
    exit;
}

// Verify the email
$stmt = $conn->prepare("UPDATE users SET email_verified = 1, verification_token = NULL, token_expiry = NULL WHERE user_id = ?");
$stmt->bind_param("i", $user['user_id']);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Email verified successfully"
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to verify email"]);
}

$stmt->close();
$conn->close();
?>
