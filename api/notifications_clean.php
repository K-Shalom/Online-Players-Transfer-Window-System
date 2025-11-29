<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
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

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch notifications
if ($method === 'GET') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    if (isset($_GET['user_id'])) {
        // Get notifications for specific user
        $requestedUserId = intval($_GET['user_id']);
        
        // Check if user can access these notifications
        if ($currentUser['role'] !== 'admin' && $requestedUserId !== $currentUser['user_id']) {
            echo json_encode(["success" => false, "message" => "Access denied"]);
            exit;
        }
        
        $user_id = $requestedUserId;
        $unread_only = isset($_GET['unread']) && $_GET['unread'] === 'true';
        
        if ($unread_only) {
            $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY sent_at DESC");
        } else {
            $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50");
        }
        
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $notifications = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $notifications[] = $row;
            }
        }
        
        echo json_encode(["success" => true, "data" => $notifications]);
    } else {
        // Get all notifications (admin only)
        if ($currentUser['role'] !== 'admin') {
            echo json_encode(["success" => false, "message" => "Access denied - admin only"]);
            exit;
        }
        
        $result = $conn->query("SELECT n.*, u.name as user_name, u.email FROM notifications n LEFT JOIN users u ON n.user_id = u.user_id ORDER BY n.sent_at DESC LIMIT 100");
        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = $row;
        }
        
        echo json_encode(["success" => true, "data" => $notifications]);
    }
}

// POST - Create notification
elseif ($method === 'POST') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    // Only admins can create notifications
    if ($currentUser['role'] !== 'admin') {
        echo json_encode(["success" => false, "message" => "Access denied - admin only"]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    $user_id = intval($data['user_id'] ?? 0);
    $message = trim($data['message'] ?? '');
    $type = $data['type'] ?? 'info';
    
    if (!$user_id || !$message) {
        echo json_encode(["success" => false, "message" => "User ID and message required"]);
        exit;
    }
    
    // Validate type
    $valid_types = ['info', 'success', 'warning', 'error'];
    if (!in_array($type, $valid_types)) {
        $type = 'info';
    }
    
    $stmt = $conn->prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user_id, $message, $type);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Notification created", "notif_id" => $conn->insert_id]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create notification"]);
    }
}

// PUT - Mark as read or mark all as read
elseif ($method === 'PUT') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['notif_id'])) {
        // Mark single notification as read
        $notif_id = intval($data['notif_id']);
        
        // Check if user owns this notification
        $checkStmt = $conn->prepare("SELECT user_id FROM notifications WHERE notif_id = ?");
        $checkStmt->bind_param("i", $notif_id);
        $checkStmt->execute();
        $notif = $checkStmt->get_result()->fetch_assoc();
        
        if (!$notif || ($currentUser['role'] !== 'admin' && $notif['user_id'] !== $currentUser['user_id'])) {
            echo json_encode(["success" => false, "message" => "Access denied"]);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notif_id = ?");
        $stmt->bind_param("i", $notif_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Notification marked as read"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to mark notification as read"]);
        }
    } elseif (isset($data['user_id']) && isset($data['mark_all_read'])) {
        // Mark all notifications as read for user
        $user_id = intval($data['user_id']);
        
        // Check if user can mark these notifications
        if ($currentUser['role'] !== 'admin' && $user_id !== $currentUser['user_id']) {
            echo json_encode(["success" => false, "message" => "Access denied"]);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "All notifications marked as read"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to mark all notifications as read"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Notification ID or user ID required"]);
    }
}

// DELETE - Delete notifications
elseif ($method === 'DELETE') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['notif_id'])) {
        // Delete single notification
        $notif_id = intval($data['notif_id']);
        
        // Check if user owns this notification
        $checkStmt = $conn->prepare("SELECT user_id FROM notifications WHERE notif_id = ?");
        $checkStmt->bind_param("i", $notif_id);
        $checkStmt->execute();
        $notif = $checkStmt->get_result()->fetch_assoc();
        
        if (!$notif || ($currentUser['role'] !== 'admin' && $notif['user_id'] !== $currentUser['user_id'])) {
            echo json_encode(["success" => false, "message" => "Access denied"]);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM notifications WHERE notif_id = ?");
        $stmt->bind_param("i", $notif_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Notification deleted"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete notification"]);
        }
    } elseif (isset($data['user_id']) && isset($data['delete_all_read'])) {
        // Delete all read notifications for user
        $user_id = intval($data['user_id']);
        
        // Check if user can delete these notifications
        if ($currentUser['role'] !== 'admin' && $user_id !== $currentUser['user_id']) {
            echo json_encode(["success" => false, "message" => "Access denied"]);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM notifications WHERE user_id = ? AND is_read = 1");
        $stmt->bind_param("i", $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Read notifications deleted"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete read notifications"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Notification ID or user ID required"]);
    }
}

$conn->close();
?>
