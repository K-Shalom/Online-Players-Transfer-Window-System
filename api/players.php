<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

// GET - Fetch all players or single player
if ($method === 'GET') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
    $playerId = $_GET['id'] ?? null;
    
    if ($playerId) {
        // Get single player
        $stmt = $conn->prepare("SELECT p.*, c.club_name 
            FROM players p 
            LEFT JOIN clubs c ON p.club_id = c.club_id 
            WHERE p.player_id = ?");
        $stmt->bind_param("i", $playerId);
        $stmt->execute();
        $result = $stmt->get_result();
        $player = $result->fetch_assoc();
        
        if ($player) {
            echo json_encode(["success" => true, "data" => $player]);
        } else {
            echo json_encode(["success" => false, "message" => "Player not found"]);
        }
    } else {
        $position = $_GET['position'] ?? null;
        $nationality = $_GET['nationality'] ?? null;
        $min_age = isset($_GET['min_age']) ? intval($_GET['min_age']) : null;
        $max_age = isset($_GET['max_age']) ? intval($_GET['max_age']) : null;
        $min_value = isset($_GET['min_value']) ? floatval($_GET['min_value']) : null;
        $max_value = isset($_GET['max_value']) ? floatval($_GET['max_value']) : null;
        $free_only = isset($_GET['free_only']) && $_GET['free_only'] === 'true';

        $base = "SELECT p.player_id as id, p.name, p.age, p.nationality, p.position, p.market_value, p.contract_end, p.health_status, p.status, p.photo_url, c.club_name as club, c.club_id FROM players p LEFT JOIN clubs c ON p.club_id = c.club_id";
        $conditions = ["p.status = 'active'"];
        $types = "";
        $params = [];

        if ($position) { $conditions[] = "p.position = ?"; $types .= "s"; $params[] = $position; }
        if ($nationality) { $conditions[] = "p.nationality = ?"; $types .= "s"; $params[] = $nationality; }
        if ($min_age !== null) { $conditions[] = "p.age >= ?"; $types .= "i"; $params[] = $min_age; }
        if ($max_age !== null) { $conditions[] = "p.age <= ?"; $types .= "i"; $params[] = $max_age; }
        if ($min_value !== null) { $conditions[] = "p.market_value >= ?"; $types .= "d"; $params[] = $min_value; }
        if ($max_value !== null) { $conditions[] = "p.market_value <= ?"; $types .= "d"; $params[] = $max_value; }
        if ($free_only) { $conditions[] = "(p.contract_end IS NOT NULL AND p.contract_end <= CURDATE())"; }

        $query = $base . " WHERE " . implode(" AND ", $conditions) . " ORDER BY p.created_at DESC";

        if ($types !== "") {
            $stmt = $conn->prepare($query);
            $bind = [];
            $bind[] = $types;
            for ($i = 0; $i < count($params); $i++) { $bind[] = &$params[$i]; }
            call_user_func_array([$stmt, 'bind_param'], $bind);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query($query);
        }

        $players = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $players[] = [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'age' => $row['age'],
                    'nationality' => $row['nationality'],
                    'position' => $row['position'],
                    'market_value' => $row['market_value'] ? '$' . number_format($row['market_value'], 2) : 'N/A',
                    'contract_end' => $row['contract_end'],
                    'health_status' => $row['health_status'],
                    'status' => $row['status'],
                    'club' => $row['club'] ?? 'Free Agent',
                    'club_id' => $row['club_id'],
                    'photo_url' => $row['photo_url']
                ];
            }
        }

        echo json_encode(["success" => true, "data" => $players]);
    }
}

// POST - Create new player
if ($method === 'POST') {
    require_once 'upload_helper.php';
    
    $action = $_POST['action'] ?? '';
    
    // Handle file upload for photo
    $photoUrl = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadResult = uploadImage($_FILES['photo'], 'players');
        if ($uploadResult['success']) {
            $photoUrl = $uploadResult['url'];
        }
    }
    
    if ($action === 'update') {
        // Update existing player
        $playerId = $_POST['player_id'] ?? null;
        $clubId = $_POST['club_id'] ?? null;
        $name = trim($_POST['name'] ?? '');
        $age = $_POST['age'] ?? null;
        $nationality = trim($_POST['nationality'] ?? '');
        $position = trim($_POST['position'] ?? '');
        $marketValue = $_POST['market_value'] ?? 0;
        $contractEnd = $_POST['contract_end'] ?? null;
        $healthStatus = $_POST['health_status'] ?? 'fit';
        
        if (!$playerId) {
            echo json_encode(["success" => false, "message" => "Player ID required"]);
            exit;
        }
        
        if ($photoUrl !== null) {
            $stmt = $conn->prepare("UPDATE players SET club_id=?, name=?, age=?, nationality=?, position=?, 
                                   market_value=?, contract_end=?, health_status=?, photo_url=? WHERE player_id=?");
            $stmt->bind_param("isissdssi", $clubId, $name, $age, $nationality, $position, $marketValue, $contractEnd, $healthStatus, $photoUrl, $playerId);
        } else {
            $stmt = $conn->prepare("UPDATE players SET club_id=?, name=?, age=?, nationality=?, position=?, 
                                   market_value=?, contract_end=?, health_status=? WHERE player_id=?");
            $stmt->bind_param("isissdssi", $clubId, $name, $age, $nationality, $position, $marketValue, $contractEnd, $healthStatus, $playerId);
        }
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "message" => "Player updated successfully",
                "photo_url" => $photoUrl
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update player"]);
        }
    } else {
        // Create new player
        $clubId = $_POST['club_id'] ?? null;
        $name = trim($_POST['name'] ?? '');
        $age = $_POST['age'] ?? null;
        $nationality = trim($_POST['nationality'] ?? '');
        $position = trim($_POST['position'] ?? '');
        $marketValue = $_POST['market_value'] ?? 0;
        $contractEnd = $_POST['contract_end'] ?? null;
        $healthStatus = $_POST['health_status'] ?? 'fit';
        
        if (!$name || !$position) {
            echo json_encode(["success" => false, "message" => "Name and position are required"]);
            exit;
        }

        // Check if player already exists in another club (active status)
        $checkStmt = $conn->prepare("SELECT player_id, club_id FROM players WHERE name = ? AND nationality = ? AND status = 'active'");
        $checkStmt->bind_param("ss", $name, $nationality);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows > 0) {
            $existingPlayer = $checkResult->fetch_assoc();
            // If player exists and belongs to a club (club_id is not null)
            if ($existingPlayer['club_id'] !== null) {
                echo json_encode([
                    "success" => false, 
                    "message" => "Player already exists in another club. You cannot add them manually. Please use the Transfer system."
                ]);
                exit;
            }
        }
        
        $stmt = $conn->prepare("INSERT INTO players (club_id, name, age, nationality, position, market_value, contract_end, health_status, status, photo_url) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)");
        $stmt->bind_param("isissdsss", $clubId, $name, $age, $nationality, $position, $marketValue, $contractEnd, $healthStatus, $photoUrl);
        
        if ($stmt->execute()) {
            echo json_encode([
                "success" => true, 
                "message" => "Player added successfully",
                "player_id" => $conn->insert_id,
                "photo_url" => $photoUrl
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add player: " . $conn->error]);
        }
    }
}

// PUT - Update player
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $playerId = $data['player_id'] ?? null;
    $clubId = $data['club_id'] ?? null;
    $name = trim($data['name'] ?? '');
    $age = $data['age'] ?? null;
    $nationality = trim($data['nationality'] ?? '');
    $position = trim($data['position'] ?? '');
    $marketValue = $data['market_value'] ?? 0;
    $contractEnd = $data['contract_end'] ?? null;
    $healthStatus = $data['health_status'] ?? 'fit';
    
    if (!$playerId) {
        echo json_encode(["success" => false, "message" => "Player ID required"]);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE players SET club_id=?, name=?, age=?, nationality=?, position=?, 
                           market_value=?, contract_end=?, health_status=? WHERE player_id=?");
    $stmt->bind_param("isissdssi", $clubId, $name, $age, $nationality, $position, $marketValue, $contractEnd, $healthStatus, $playerId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Player updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update player"]);
    }
}

// DELETE - Delete player
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $playerId = $data['player_id'] ?? null;
    
    if (!$playerId) {
        echo json_encode(["success" => false, "message" => "Player ID required"]);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE players SET status='retired' WHERE player_id=?");
    $stmt->bind_param("i", $playerId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Player deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete player"]);
    }
}
?>
