<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch wishlists
if ($method === 'GET') {
    if (isset($_GET['club_id'])) {
        // Get wishlist for specific club
        $club_id = intval($_GET['club_id']);
        $stmt = $conn->prepare("
            SELECT w.*, 
                   p.name as player_name,
                   p.age,
                   p.nationality,
                   p.position,
                   p.market_value,
                   p.health_status,
                   p.photo_url,
                   c.club_name as current_club,
                   c.country as club_country
            FROM wishlists w
            LEFT JOIN players p ON w.player_id = p.player_id
            LEFT JOIN clubs c ON p.club_id = c.club_id
            WHERE w.club_id = ?
            ORDER BY w.created_at DESC
        ");
        $stmt->bind_param("i", $club_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $wishlists = [];
        while ($row = $result->fetch_assoc()) {
            $wishlists[] = $row;
        }
        echo json_encode(["success" => true, "data" => $wishlists]);
    } else {
        // Get all wishlists (admin)
        $result = $conn->query("
            SELECT w.*, 
                   p.name as player_name,
                   p.position,
                   c1.club_name as wishlist_club,
                   c2.club_name as current_club
            FROM wishlists w
            LEFT JOIN players p ON w.player_id = p.player_id
            LEFT JOIN clubs c1 ON w.club_id = c1.club_id
            LEFT JOIN clubs c2 ON p.club_id = c2.club_id
            ORDER BY w.created_at DESC
        ");
        $wishlists = [];
        while ($row = $result->fetch_assoc()) {
            $wishlists[] = $row;
        }
        echo json_encode(["success" => true, "data" => $wishlists]);
    }
}

// POST - Add to wishlist
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $club_id = intval($data['club_id'] ?? 0);
    $player_id = intval($data['player_id'] ?? 0);
    
    if (!$club_id || !$player_id) {
        echo json_encode(["success" => false, "message" => "Club ID and Player ID required"]);
        exit;
    }
    
    // Check if player exists
    $stmt = $conn->prepare("SELECT player_id, club_id FROM players WHERE player_id = ?");
    $stmt->bind_param("i", $player_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $player = $result->fetch_assoc();
    
    if (!$player) {
        echo json_encode(["success" => false, "message" => "Player not found"]);
        exit;
    }
    
    // Check if club is trying to add their own player
    if ($player['club_id'] == $club_id) {
        echo json_encode(["success" => false, "message" => "Cannot add your own player to wishlist"]);
        exit;
    }
    
    // Check if already in wishlist
    $stmt = $conn->prepare("SELECT wishlist_id FROM wishlists WHERE club_id = ? AND player_id = ?");
    $stmt->bind_param("ii", $club_id, $player_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Player already in wishlist"]);
        exit;
    }
    
    // Add to wishlist
    $stmt = $conn->prepare("INSERT INTO wishlists (club_id, player_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $club_id, $player_id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Player added to wishlist", "wishlist_id" => $conn->insert_id]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add to wishlist"]);
    }
}

// DELETE - Remove from wishlist
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['wishlist_id'])) {
        $wishlist_id = intval($data['wishlist_id']);
        $stmt = $conn->prepare("DELETE FROM wishlists WHERE wishlist_id = ?");
        $stmt->bind_param("i", $wishlist_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Removed from wishlist"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to remove from wishlist"]);
        }
    } elseif (isset($data['club_id']) && isset($data['player_id'])) {
        // Remove by club_id and player_id
        $club_id = intval($data['club_id']);
        $player_id = intval($data['player_id']);
        
        $stmt = $conn->prepare("DELETE FROM wishlists WHERE club_id = ? AND player_id = ?");
        $stmt->bind_param("ii", $club_id, $player_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Removed from wishlist"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to remove from wishlist"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Wishlist ID or Club ID and Player ID required"]);
    }
}

$conn->close();
?>
