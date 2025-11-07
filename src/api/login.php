<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

if (!$username || !$password) {
    echo json_encode(["success"=>false,"message"=>"Username and password required"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, password, role FROM users WHERE username=?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if ($row && password_verify($password, $row['password'])) {
    echo json_encode([
        "success"=>true,
        "id"=>$row['id'],
        "username"=>$row['username'],
        "role"=>$row['role']
    ]);
} else {
    echo json_encode(["success"=>false,"message"=>"Invalid credentials"]);
}
?>
