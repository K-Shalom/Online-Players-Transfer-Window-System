<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'config.php';

// Get current user from Authorization header or session
function getCurrentUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    // For now, get user_id from Authorization header (Bearer token)
    if ($authHeader && strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7);
        // In a real app, validate JWT token here
        // For now, assume token contains user_id
        $parts = explode(':', $token);
        return ['user_id' => intval($parts[0] ?? 0), 'role' => $parts[1] ?? 'user'];
    }
    
    // Fallback to session if available
    session_start();
    if (isset($_SESSION['user_id'])) {
        return ['user_id' => $_SESSION['user_id'], 'role' => $_SESSION['role'] ?? 'user'];
    }
    
    return null;
}

// Handle GET request - fetch pending clubs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    // Only admins can view pending clubs
    if ($currentUser['role'] !== 'admin') {
        echo json_encode(["success" => false, "message" => "Access denied - admin only"]);
        exit;
    }
    
    $query = "SELECT 
        club_id,
        club_name,
        country,
        manager,
        contact,
        license_no,
        created_at
    FROM clubs
    WHERE status='pending'
    ORDER BY created_at DESC";

    $result = $conn->query($query);
    $clubs = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $clubs[] = [
                'id' => $row['club_id'],
                'name' => $row['club_name'],
                'country' => $row['country'],
                'manager' => $row['manager'],
                'contact' => $row['contact'],
                'license_no' => $row['license_no'],
                'created_at' => $row['created_at']
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "data" => $clubs
    ]);
}

// Handle POST request - approve or reject club
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    // Only admins can approve/reject clubs
    if ($currentUser['role'] !== 'admin') {
        echo json_encode(["success" => false, "message" => "Access denied - admin only"]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $clubId = $data['club_id'] ?? null;
    $action = $data['action'] ?? null; // 'approve' or 'reject'

    if (!$clubId || !$action) {
        echo json_encode(["success" => false, "message" => "Club ID and action required"]);
        exit;
    }

    if ($action === 'approve') {
        $stmt = $conn->prepare("UPDATE clubs SET status='approved' WHERE club_id=?");
        $stmt->bind_param("i", $clubId);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Club approved successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to approve club: " . $conn->error]);
        }
    } elseif ($action === 'reject') {
        // For rejection, you might want to delete or mark differently
        $stmt = $conn->prepare("DELETE FROM clubs WHERE club_id=?");
        $stmt->bind_param("i", $clubId);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Club rejected successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to reject club: " . $conn->error]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
}
?>
