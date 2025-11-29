<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Debug endpoint to see what we receive
if ($method === 'POST') {
    $debug = [
        'method' => $method,
        'files' => $_FILES,
        'post' => $_POST,
        'raw_input' => file_get_contents("php://input"),
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
    ];
    
    echo json_encode([
        "success" => true, 
        "message" => "Debug info",
        "debug" => $debug
    ]);
}
?>
