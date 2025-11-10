<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(["success" => false, "message" => "Email is required"]);
    exit;
}

// Check if user exists
$stmt = $conn->prepare("SELECT user_id, name, email_verified FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

if ($user['email_verified'] == 1) {
    echo json_encode(["success" => false, "message" => "Email already verified"]);
    exit;
}

// Generate verification token
$token = bin2hex(random_bytes(32));
$expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));

// Store token in database
$stmt = $conn->prepare("UPDATE users SET verification_token = ?, token_expiry = ? WHERE user_id = ?");
$stmt->bind_param("ssi", $token, $expiry, $user['user_id']);

if ($stmt->execute()) {
    // In a real application, send email here
    // For now, we'll just return the token (in production, this should be sent via email)
    $verificationLink = "http://localhost:5173/verify-email?token=" . $token;
    
    // TODO: Send email using PHPMailer or similar
    // For development, we'll return success with the link
    
    echo json_encode([
        "success" => true,
        "message" => "Verification email sent successfully",
        "verification_link" => $verificationLink // Remove this in production
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to generate verification token"]);
}

$stmt->close();
$conn->close();
?>
