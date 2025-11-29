<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';
require_once 'upload_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

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

// Check if user can access a specific club
function canAccessClub($user, $club) {
    if (!$user) return false;
    
    // Admin can access all clubs
    if ($user['role'] === 'admin') return true;
    
    // Club manager can only access their own club
    return isset($club['user_id']) && $club['user_id'] == $user['user_id'];
}

// GET - Fetch all clubs or single club
if ($method === 'GET') {
    $currentUser = getCurrentUser();
    $clubId = $_GET['id'] ?? null;
    $status = $_GET['status'] ?? null;
    
    if ($clubId) {
        // Get single club
        $stmt = $conn->prepare("SELECT c.*, u.name as user_name, u.email 
            FROM clubs c 
            LEFT JOIN users u ON c.user_id = u.user_id 
            WHERE c.club_id = ?");
        $stmt->bind_param("i", $clubId);
        $stmt->execute();
        $result = $stmt->get_result();
        $club = $result->fetch_assoc();
        
        if ($club && canAccessClub($currentUser, $club)) {
            echo json_encode(["success" => true, "data" => $club]);
        } elseif ($club) {
            echo json_encode(["success" => false, "message" => "Access denied"]);
        } else {
            echo json_encode(["success" => false, "message" => "Club not found"]);
        }
    } else {
        // Get clubs based on user role
        if ($currentUser && $currentUser['role'] === 'admin') {
            // Admin can see all clubs
            $query = "SELECT c.club_id as id, c.club_name as name, c.country, c.manager, 
                      c.contact, c.license_no, c.status, c.created_at, c.logo_url,
                      c.user_id, u.name as user_name, u.email
                      FROM clubs c
                      LEFT JOIN users u ON c.user_id = u.user_id";
        } elseif ($currentUser) {
            // Club manager can only see their own club
            $query = "SELECT c.club_id as id, c.club_name as name, c.country, c.manager, 
                      c.contact, c.license_no, c.status, c.created_at, c.logo_url,
                      c.user_id, u.name as user_name, u.email
                      FROM clubs c
                      LEFT JOIN users u ON c.user_id = u.user_id
                      WHERE c.user_id = " . $currentUser['user_id'];
        } else {
            echo json_encode(["success" => false, "message" => "Authentication required"]);
            exit;
        }

        if ($status) {
            // Check if query already has WHERE clause
            if (strpos($query, 'WHERE') !== false) {
                $query .= " AND c.status = ? ORDER BY c.created_at DESC";
            } else {
                $query .= " WHERE c.status = ? ORDER BY c.created_at DESC";
            }
            $stmt = $conn->prepare($query);
            $stmt->bind_param("s", $status);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $query .= " ORDER BY c.created_at DESC";
            $result = $conn->query($query);
        }
        $clubs = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $clubs[] = $row;
            }
        }
        
        echo json_encode(["success" => true, "data" => $clubs]);
    }
}

// POST - Create new club or update club (when action=update)
if ($method === 'POST') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    $action = $_POST['action'] ?? '';
    
    // Debug logging
    error_log("Clubs API - Method: POST, Action: " . $action);
    error_log("Clubs API - FILES: " . print_r($_FILES, true));
    error_log("Clubs API - POST: " . print_r($_POST, true));
    
    // Handle file upload for logo
    $logoUrl = null;
    if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        error_log("Clubs API - Logo file detected, attempting upload");
        $uploadResult = uploadImage($_FILES['logo'], 'clubs');
        if ($uploadResult['success']) {
            $logoUrl = $uploadResult['url'];
            error_log("Clubs API - Logo uploaded successfully: " . $logoUrl);
        } else {
            error_log("Clubs API - Logo upload failed: " . $uploadResult['message']);
        }
    } else {
        if (isset($_FILES['logo'])) {
            error_log("Clubs API - Logo file error: " . $_FILES['logo']['error']);
        } else {
            error_log("Clubs API - No logo file detected");
        }
    }
    
    if ($action === 'update') {
        // Update existing club
        $clubId = $_POST['club_id'] ?? null;
        $clubName = trim($_POST['club_name'] ?? '');
        $country = trim($_POST['country'] ?? '');
        $manager = trim($_POST['manager'] ?? '');
        $contact = trim($_POST['contact'] ?? '');
        $licenseNo = trim($_POST['license_no'] ?? '');
        $status = $_POST['status'] ?? 'pending';
        
        if (!$clubId) {
            echo json_encode(["success" => false, "message" => "Club ID required"]);
            exit;
        }
        
        // Check if user can update this club
        $checkStmt = $conn->prepare("SELECT user_id FROM clubs WHERE club_id = ?");
        $checkStmt->bind_param("i", $clubId);
        $checkStmt->execute();
        $existingClub = $checkStmt->get_result()->fetch_assoc();
        
        if (!canAccessClub($currentUser, $existingClub)) {
            echo json_encode(["success" => false, "message" => "Access denied - you can only update your own club"]);
            exit;
        }
        
        // Build update query dynamically based on whether logo is being updated
        if ($logoUrl !== null) {
            $stmt = $conn->prepare("UPDATE clubs SET club_name=?, country=?, manager=?, contact=?, license_no=?, status=?, logo_url=? 
                                   WHERE club_id=?");
            $stmt->bind_param("sssssssi", $clubName, $country, $manager, $contact, $licenseNo, $status, $logoUrl, $clubId);
        } else {
            $stmt = $conn->prepare("UPDATE clubs SET club_name=?, country=?, manager=?, contact=?, license_no=?, status=? 
                                   WHERE club_id=?");
            $stmt->bind_param("ssssssi", $clubName, $country, $manager, $contact, $licenseNo, $status, $clubId);
        }
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "message" => "Club updated successfully",
                "logo_url" => $logoUrl
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update club"]);
        }
    } else {
        // Create new club
        $userId = $_POST['user_id'] ?? $currentUser['user_id']; // Use current user if not specified
        $clubName = trim($_POST['club_name'] ?? '');
        $country = trim($_POST['country'] ?? '');
        $manager = trim($_POST['manager'] ?? '');
        $contact = trim($_POST['contact'] ?? '');
        $licenseNo = trim($_POST['license_no'] ?? '');
        $status = $_POST['status'] ?? 'pending';
        
        // Only admins can create clubs for other users
        if ($currentUser['role'] !== 'admin' && $userId != $currentUser['user_id']) {
            echo json_encode(["success" => false, "message" => "Access denied - you can only create clubs for yourself"]);
            exit;
        }
        
        if (!$clubName || !$country || !$manager) {
            echo json_encode(["success" => false, "message" => "Club name, country, and manager are required"]);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO clubs (user_id, club_name, country, manager, contact, license_no, status, logo_url) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssssss", $userId, $clubName, $country, $manager, $contact, $licenseNo, $status, $logoUrl);
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "message" => "Club added successfully",
                "club_id" => $conn->insert_id,
                "logo_url" => $logoUrl
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add club: " . $conn->error]);
        }
    }
}

// PUT - Update club (legacy, use POST with action=update instead)
if ($method === 'PUT') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    // Handle file upload for logo
    $logoUrl = null;
    if (isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
        $uploadResult = uploadImage($_FILES['logo'], 'clubs');
        if ($uploadResult['success']) {
            $logoUrl = $uploadResult['url'];
        }
    }
    
    // For PUT requests with FormData, PHP doesn't populate $_POST automatically
    // We need to parse the raw input
    $rawData = file_get_contents("php://input");
    $data = [];
    
    // Try to extract form data from the raw request
    if (strpos($rawData, 'Content-Disposition: form-data') !== false) {
        // This is a multipart form request
        $boundary = substr($rawData, 0, strpos($rawData, "\r\n"));
        $parts = array_slice(explode($boundary . "\r\n", $rawData), 1, -1);
        
        foreach ($parts as $part) {
            if ($part === "--\r\n") continue;
            
            $part = ltrim($part, "\r\n");
            list($headers, $value) = explode("\r\n\r\n", $part, 2);
            $value = trim($value, "\r\n");
            
            if (preg_match('/name="([^"]+)"/', $headers, $matches)) {
                $fieldName = $matches[1];
                $data[$fieldName] = $value;
            }
        }
    } else {
        // Fallback to JSON
        $data = json_decode($rawData, true) ?? [];
    }
    
    $clubId = $data['club_id'] ?? null;
    
    if (!$clubId) {
        echo json_encode(["success" => false, "message" => "Club ID required"]);
        exit;
    }
    
    // Check if user can update this club
    $checkStmt = $conn->prepare("SELECT user_id FROM clubs WHERE club_id = ?");
    $checkStmt->bind_param("i", $clubId);
    $checkStmt->execute();
    $existingClub = $checkStmt->get_result()->fetch_assoc();
    
    if (!canAccessClub($currentUser, $existingClub)) {
        echo json_encode(["success" => false, "message" => "Access denied - you can only update your own club"]);
        exit;
    }
    
    $clubName = trim($data['club_name'] ?? '');
    $country = trim($data['country'] ?? '');
    $manager = trim($data['manager'] ?? '');
    $contact = trim($data['contact'] ?? '');
    $licenseNo = trim($data['license_no'] ?? '');
    $status = $data['status'] ?? 'pending';
    
    // Build update query dynamically based on whether logo is being updated
    if ($logoUrl !== null) {
        $stmt = $conn->prepare("UPDATE clubs SET club_name=?, country=?, manager=?, contact=?, license_no=?, status=?, logo_url=? 
                               WHERE club_id=?");
        $stmt->bind_param("sssssssi", $clubName, $country, $manager, $contact, $licenseNo, $status, $logoUrl, $clubId);
    } else {
        $stmt = $conn->prepare("UPDATE clubs SET club_name=?, country=?, manager=?, contact=?, license_no=?, status=? 
                               WHERE club_id=?");
        $stmt->bind_param("ssssssi", $clubName, $country, $manager, $contact, $licenseNo, $status, $clubId);
    }
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true, 
            "message" => "Club updated successfully",
            "logo_url" => $logoUrl
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update club"]);
    }
}

// DELETE - Delete club
if ($method === 'DELETE') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $clubId = $data['club_id'] ?? null;
    
    if (!$clubId) {
        echo json_encode(["success" => false, "message" => "Club ID required"]);
        exit;
    }
    
    // Check if user can delete this club
    $checkStmt = $conn->prepare("SELECT user_id FROM clubs WHERE club_id = ?");
    $checkStmt->bind_param("i", $clubId);
    $checkStmt->execute();
    $existingClub = $checkStmt->get_result()->fetch_assoc();
    
    if (!canAccessClub($currentUser, $existingClub)) {
        echo json_encode(["success" => false, "message" => "Access denied - you can only delete your own club"]);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM clubs WHERE club_id=?");
    $stmt->bind_param("i", $clubId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Club deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete club"]);
    }
}
?>
