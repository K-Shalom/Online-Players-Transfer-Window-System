<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all clubs or single club
if ($method === 'GET') {
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
        
        if ($club) {
            echo json_encode(["success" => true, "data" => $club]);
        } else {
            echo json_encode(["success" => false, "message" => "Club not found"]);
        }
    } else {
        // Get all clubs
        $query = "SELECT c.club_id as id, c.club_name as name, c.country, c.manager, 
                  c.contact, c.license_no, c.status, c.created_at, c.logo_url,
                  c.user_id, u.name as user_name, u.email
                  FROM clubs c
                  LEFT JOIN users u ON c.user_id = u.user_id";
        
        if ($status) {
            $query .= " WHERE c.status = '$status'";
        }
        
        $query .= " ORDER BY c.created_at DESC";
        
        $result = $conn->query($query);
        $clubs = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $clubs[] = $row;
            }
        }
        
        echo json_encode(["success" => true, "data" => $clubs]);
    }
}

// POST - Create new club
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $userId = $data['user_id'] ?? null;
    $clubName = trim($data['club_name'] ?? '');
    $country = trim($data['country'] ?? '');
    $manager = trim($data['manager'] ?? '');
    $contact = trim($data['contact'] ?? '');
    $licenseNo = trim($data['license_no'] ?? '');
    $status = $data['status'] ?? 'pending';
    
    if (!$clubName || !$country || !$manager) {
        echo json_encode(["success" => false, "message" => "Club name, country, and manager are required"]);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO clubs (user_id, club_name, country, manager, contact, license_no, status) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssss", $userId, $clubName, $country, $manager, $contact, $licenseNo, $status);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true, 
            "message" => "Club added successfully",
            "club_id" => $conn->insert_id
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add club: " . $conn->error]);
    }
}

// PUT - Update club
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $clubId = $data['club_id'] ?? null;
    $clubName = trim($data['club_name'] ?? '');
    $country = trim($data['country'] ?? '');
    $manager = trim($data['manager'] ?? '');
    $contact = trim($data['contact'] ?? '');
    $licenseNo = trim($data['license_no'] ?? '');
    $status = $data['status'] ?? 'pending';
    
    if (!$clubId) {
        echo json_encode(["success" => false, "message" => "Club ID required"]);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE clubs SET club_name=?, country=?, manager=?, contact=?, license_no=?, status=? 
                           WHERE club_id=?");
    $stmt->bind_param("ssssssi", $clubName, $country, $manager, $contact, $licenseNo, $status, $clubId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Club updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update club"]);
    }
}

// DELETE - Delete club
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $clubId = $data['club_id'] ?? null;
    
    if (!$clubId) {
        echo json_encode(["success" => false, "message" => "Club ID required"]);
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
