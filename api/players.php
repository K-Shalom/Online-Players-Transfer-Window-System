<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all players or single player
if ($method === 'GET') {
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
        // Get all players
        $query = "SELECT p.player_id as id, p.name, p.age, p.nationality, p.position, 
                  p.market_value, p.contract_end, p.health_status, p.status, p.photo_url,
                  c.club_name as club, c.club_id
                  FROM players p
                  LEFT JOIN clubs c ON p.club_id = c.club_id
                  WHERE p.status = 'active'
                  ORDER BY p.created_at DESC";
        
        $result = $conn->query($query);
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
    $data = json_decode(file_get_contents("php://input"), true);
    
    $clubId = $data['club_id'] ?? null;
    $name = trim($data['name'] ?? '');
    $age = $data['age'] ?? null;
    $nationality = trim($data['nationality'] ?? '');
    $position = trim($data['position'] ?? '');
    $marketValue = $data['market_value'] ?? 0;
    $contractEnd = $data['contract_end'] ?? null;
    $healthStatus = $data['health_status'] ?? 'fit';
    
    if (!$name || !$position) {
        echo json_encode(["success" => false, "message" => "Name and position are required"]);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO players (club_id, name, age, nationality, position, market_value, contract_end, health_status, status) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')");
    $stmt->bind_param("isissdss", $clubId, $name, $age, $nationality, $position, $marketValue, $contractEnd, $healthStatus);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true, 
            "message" => "Player added successfully",
            "player_id" => $conn->insert_id
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add player: " . $conn->error]);
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
    $stmt->bind_param("isissdsi", $clubId, $name, $age, $nationality, $position, $marketValue, $contractEnd, $healthStatus, $playerId);
    
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
