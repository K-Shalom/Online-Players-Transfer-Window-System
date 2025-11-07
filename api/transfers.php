<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all transfers or single transfer
if ($method === 'GET') {
    $transferId = $_GET['id'] ?? null;
    
    if ($transferId) {
        // Get single transfer
        $stmt = $conn->prepare("SELECT t.*, 
            p.name as player_name,
            sc.club_name as seller_club_name,
            bc.club_name as buyer_club_name
            FROM transfers t
            LEFT JOIN players p ON t.player_id = p.player_id
            LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
            LEFT JOIN clubs bc ON t.buyer_club_id = bc.club_id
            WHERE t.transfer_id = ?");
        $stmt->bind_param("i", $transferId);
        $stmt->execute();
        $result = $stmt->get_result();
        $transfer = $result->fetch_assoc();
        
        if ($transfer) {
            echo json_encode(["success" => true, "data" => $transfer]);
        } else {
            echo json_encode(["success" => false, "message" => "Transfer not found"]);
        }
    } else {
        // Get all transfers
        $query = "SELECT t.transfer_id as id, t.type, t.amount, t.status, t.created_at,
                  p.name as player_name, p.player_id,
                  sc.club_name as seller_club, sc.club_id as seller_club_id,
                  bc.club_name as buyer_club, bc.club_id as buyer_club_id
                  FROM transfers t
                  LEFT JOIN players p ON t.player_id = p.player_id
                  LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
                  LEFT JOIN clubs bc ON t.buyer_club_id = bc.club_id
                  ORDER BY t.created_at DESC";
        
        $result = $conn->query($query);
        $transfers = [];
        
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $transfers[] = [
                    'id' => $row['id'],
                    'player_name' => $row['player_name'] ?? 'Unknown',
                    'player_id' => $row['player_id'],
                    'seller_club' => $row['seller_club'] ?? 'Unknown',
                    'seller_club_id' => $row['seller_club_id'],
                    'buyer_club' => $row['buyer_club'] ?? 'Unknown',
                    'buyer_club_id' => $row['buyer_club_id'],
                    'type' => $row['type'],
                    'amount' => $row['amount'] ? '$' . number_format($row['amount'], 2) : 'N/A',
                    'amount_raw' => $row['amount'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at']
                ];
            }
        }
        
        echo json_encode(["success" => true, "data" => $transfers]);
    }
}

// POST - Create new transfer
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $playerId = $data['player_id'] ?? null;
    $sellerClubId = $data['seller_club_id'] ?? null;
    $buyerClubId = $data['buyer_club_id'] ?? null;
    $type = $data['type'] ?? 'Permanent';
    $amount = $data['amount'] ?? 0;
    $status = $data['status'] ?? 'pending';
    
    if (!$playerId || !$sellerClubId || !$buyerClubId) {
        echo json_encode(["success" => false, "message" => "Player, seller club, and buyer club are required"]);
        exit;
    }
    
    $stmt = $conn->prepare("INSERT INTO transfers (player_id, seller_club_id, buyer_club_id, type, amount, status) 
                           VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iiisds", $playerId, $sellerClubId, $buyerClubId, $type, $amount, $status);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true, 
            "message" => "Transfer created successfully",
            "transfer_id" => $conn->insert_id
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create transfer: " . $conn->error]);
    }
}

// PUT - Update transfer
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $transferId = $data['transfer_id'] ?? null;
    $status = $data['status'] ?? null;
    $amount = $data['amount'] ?? null;
    
    if (!$transferId) {
        echo json_encode(["success" => false, "message" => "Transfer ID required"]);
        exit;
    }
    
    if ($status) {
        $stmt = $conn->prepare("UPDATE transfers SET status=? WHERE transfer_id=?");
        $stmt->bind_param("si", $status, $transferId);
    } elseif ($amount !== null) {
        $stmt = $conn->prepare("UPDATE transfers SET amount=? WHERE transfer_id=?");
        $stmt->bind_param("di", $amount, $transferId);
    } else {
        echo json_encode(["success" => false, "message" => "No update data provided"]);
        exit;
    }
    
    if ($stmt->execute()) {
        // If transfer is completed, update player's club
        if ($status === 'completed') {
            $getTransfer = $conn->prepare("SELECT buyer_club_id, player_id FROM transfers WHERE transfer_id=?");
            $getTransfer->bind_param("i", $transferId);
            $getTransfer->execute();
            $transferData = $getTransfer->get_result()->fetch_assoc();
            
            if ($transferData) {
                $updatePlayer = $conn->prepare("UPDATE players SET club_id=? WHERE player_id=?");
                $updatePlayer->bind_param("ii", $transferData['buyer_club_id'], $transferData['player_id']);
                $updatePlayer->execute();
            }
        }
        
        echo json_encode(["success" => true, "message" => "Transfer updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update transfer"]);
    }
}

// DELETE - Delete transfer
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $transferId = $data['transfer_id'] ?? null;
    
    if (!$transferId) {
        echo json_encode(["success" => false, "message" => "Transfer ID required"]);
        exit;
    }
    
    $stmt = $conn->prepare("DELETE FROM transfers WHERE transfer_id=?");
    $stmt->bind_param("i", $transferId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Transfer deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete transfer"]);
    }
}
?>
