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

// Transfer window helpers
function tw_ensure($conn) {
    $check = $conn->query("SHOW TABLES LIKE 'transfer_windows'");
    if (!$check || $check->num_rows === 0) {
        $conn->query("CREATE TABLE IF NOT EXISTS transfer_windows (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, start_at DATETIME NOT NULL, end_at DATETIME NOT NULL, is_open TINYINT(1) DEFAULT 0, created_by INT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
    }
}

function tw_is_open($conn) {
    tw_ensure($conn);
    $sql = "SELECT id FROM transfer_windows WHERE is_open = 1 AND start_at <= NOW() AND end_at >= NOW() LIMIT 1";
    $res = $conn->query($sql);
    return ($res && $res->num_rows > 0);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch offers
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Get single offer
        $offer_id = intval($_GET['id']);
        $stmt = $conn->prepare("
            SELECT o.*, 
                   t.player_id, t.seller_club_id,
                   p.name as player_name,
                   sc.club_name as seller_club,
                   bc.club_name as buyer_club
            FROM offers o
            LEFT JOIN transfers t ON o.transfer_id = t.transfer_id
            LEFT JOIN players p ON t.player_id = p.player_id
            LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
            LEFT JOIN clubs bc ON o.buyer_club_id = bc.club_id
            WHERE o.offer_id = ?
        ");
        $stmt->bind_param("i", $offer_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $offer = $result->fetch_assoc();
        
        if ($offer) {
            echo json_encode(["success" => true, "data" => $offer]);
        } else {
            echo json_encode(["success" => false, "message" => "Offer not found"]);
        }
    } elseif (isset($_GET['transfer_id'])) {
        // Get offers for a specific transfer
        $transfer_id = intval($_GET['transfer_id']);
        $stmt = $conn->prepare("
            SELECT o.*, 
                   bc.club_name as buyer_club,
                   bc.country as buyer_country
            FROM offers o
            LEFT JOIN clubs bc ON o.buyer_club_id = bc.club_id
            WHERE o.transfer_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->bind_param("i", $transfer_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $offers = [];
        while ($row = $result->fetch_assoc()) {
            $offers[] = $row;
        }
        echo json_encode(["success" => true, "data" => $offers]);
    } elseif (isset($_GET['club_id'])) {
        // Get offers made by a specific club
        $club_id = intval($_GET['club_id']);
        $stmt = $conn->prepare("
            SELECT o.*, 
                   t.player_id,
                   p.name as player_name,
                   p.position,
                   sc.club_name as seller_club
            FROM offers o
            LEFT JOIN transfers t ON o.transfer_id = t.transfer_id
            LEFT JOIN players p ON t.player_id = p.player_id
            LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
            WHERE o.buyer_club_id = ?
            ORDER BY o.created_at DESC
        ");
        $stmt->bind_param("i", $club_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $offers = [];
        while ($row = $result->fetch_assoc()) {
            $offers[] = $row;
        }
        echo json_encode(["success" => true, "data" => $offers]);
    } else {
        // Get all offers
        $result = $conn->query("
            SELECT o.*, 
                   t.player_id,
                   p.name as player_name,
                   p.position,
                   sc.club_name as seller_club,
                   bc.club_name as buyer_club
            FROM offers o
            LEFT JOIN transfers t ON o.transfer_id = t.transfer_id
            LEFT JOIN players p ON t.player_id = p.player_id
            LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
            LEFT JOIN clubs bc ON o.buyer_club_id = bc.club_id
            ORDER BY o.created_at DESC
        ");
        $offers = [];
        while ($row = $result->fetch_assoc()) {
            $offers[] = $row;
        }
        echo json_encode(["success" => true, "data" => $offers]);
    }
}

// POST - Create new offer
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Enforce transfer window open
    if (!tw_is_open($conn)) {
        echo json_encode(["success" => false, "message" => "Transfer window is closed. Offers cannot be created now."]);
        exit;
    }
    
    $transfer_id = intval($data['transfer_id'] ?? 0);
    $buyer_club_id = intval($data['buyer_club_id'] ?? 0);
    $offered_amount = floatval($data['offered_amount'] ?? 0);
    
    if (!$transfer_id || !$buyer_club_id || $offered_amount <= 0) {
        echo json_encode(["success" => false, "message" => "Transfer ID, buyer club, and valid amount required"]);
        exit;
    }
    
    // Check if transfer exists and is available
    $stmt = $conn->prepare("SELECT status, seller_club_id FROM transfers WHERE transfer_id = ?");
    $stmt->bind_param("i", $transfer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $transfer = $result->fetch_assoc();
    
    if (!$transfer) {
        echo json_encode(["success" => false, "message" => "Transfer not found"]);
        exit;
    }
    
    if ($transfer['status'] !== 'pending') {
        echo json_encode(["success" => false, "message" => "Transfer is not available for offers"]);
        exit;
    }
    
    // Check if club is trying to buy from itself
    if ($transfer['seller_club_id'] == $buyer_club_id) {
        echo json_encode(["success" => false, "message" => "Cannot make offer to your own club"]);
        exit;
    }
    
    // Check for duplicate offer from same club
    $stmt = $conn->prepare("SELECT offer_id FROM offers WHERE transfer_id = ? AND buyer_club_id = ? AND status = 'pending'");
    $stmt->bind_param("ii", $transfer_id, $buyer_club_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "You already have a pending offer for this transfer"]);
        exit;
    }
    
    // Create offer
    $stmt = $conn->prepare("INSERT INTO offers (transfer_id, buyer_club_id, offered_amount, status) VALUES (?, ?, ?, 'pending')");
    $stmt->bind_param("iid", $transfer_id, $buyer_club_id, $offered_amount);
    
    if ($stmt->execute()) {
        // Update transfer status to negotiation
        $conn->query("UPDATE transfers SET status = 'negotiation' WHERE transfer_id = $transfer_id");
        
        echo json_encode(["success" => true, "message" => "Offer submitted successfully", "offer_id" => $conn->insert_id]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create offer"]);
    }
}

// PUT - Update offer (accept/reject/counter)
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $offer_id = intval($data['offer_id'] ?? 0);
    $action = $data['action'] ?? '';
    
    if (!$offer_id || !$action) {
        echo json_encode(["success" => false, "message" => "Offer ID and action required"]);
        exit;
    }
    
    // Get offer details
    $stmt = $conn->prepare("SELECT * FROM offers WHERE offer_id = ?");
    $stmt->bind_param("i", $offer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $offer = $result->fetch_assoc();
    
    if (!$offer) {
        echo json_encode(["success" => false, "message" => "Offer not found"]);
        exit;
    }
    
    if (($action === 'accept' || $action === 'counter') && !tw_is_open($conn)) {
        echo json_encode(["success" => false, "message" => "Transfer window is closed. Action not allowed."]);
        exit;
    }

    if ($action === 'accept') {
        // Accept offer
        $stmt = $conn->prepare("UPDATE offers SET status = 'accepted' WHERE offer_id = ?");
        $stmt->bind_param("i", $offer_id);
        
        if ($stmt->execute()) {
            // Reject all other offers for this transfer
            $transfer_id = $offer['transfer_id'];
            $conn->query("UPDATE offers SET status = 'rejected' WHERE transfer_id = $transfer_id AND offer_id != $offer_id AND status = 'pending'");
            
            // Update transfer with accepted offer details
            $buyer_club_id = $offer['buyer_club_id'];
            $amount = $offer['offered_amount'];
            $conn->query("UPDATE transfers SET buyer_club_id = $buyer_club_id, amount = $amount, status = 'accepted' WHERE transfer_id = $transfer_id");
            
            echo json_encode(["success" => true, "message" => "Offer accepted successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to accept offer"]);
        }
    } elseif ($action === 'reject') {
        // Reject offer
        $stmt = $conn->prepare("UPDATE offers SET status = 'rejected' WHERE offer_id = ?");
        $stmt->bind_param("i", $offer_id);
        
        if ($stmt->execute()) {
            // Check if there are any pending offers left
            $transfer_id = $offer['transfer_id'];
            $result = $conn->query("SELECT COUNT(*) as count FROM offers WHERE transfer_id = $transfer_id AND status = 'pending'");
            $row = $result->fetch_assoc();
            
            // If no pending offers, set transfer back to pending
            if ($row['count'] == 0) {
                $conn->query("UPDATE transfers SET status = 'pending' WHERE transfer_id = $transfer_id");
            }
            
            echo json_encode(["success" => true, "message" => "Offer rejected"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to reject offer"]);
        }
    } elseif ($action === 'counter') {
        // Counter offer (update amount)
        $new_amount = floatval($data['offered_amount'] ?? 0);
        
        if ($new_amount <= 0) {
            echo json_encode(["success" => false, "message" => "Valid counter amount required"]);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE offers SET offered_amount = ? WHERE offer_id = ?");
        $stmt->bind_param("di", $new_amount, $offer_id);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Counter offer sent"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to send counter offer"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
}

// DELETE - Delete offer
elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $offer_id = intval($data['offer_id'] ?? 0);
    
    if (!$offer_id) {
        echo json_encode(["success" => false, "message" => "Offer ID required"]);
        exit;
    }
    
    // Get transfer_id before deleting
    $stmt = $conn->prepare("SELECT transfer_id FROM offers WHERE offer_id = ?");
    $stmt->bind_param("i", $offer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $offer = $result->fetch_assoc();
    
    if (!$offer) {
        echo json_encode(["success" => false, "message" => "Offer not found"]);
        exit;
    }
    
    $transfer_id = $offer['transfer_id'];
    
    // Delete offer
    $stmt = $conn->prepare("DELETE FROM offers WHERE offer_id = ?");
    $stmt->bind_param("i", $offer_id);
    
    if ($stmt->execute()) {
        // Check if there are any pending offers left
        $result = $conn->query("SELECT COUNT(*) as count FROM offers WHERE transfer_id = $transfer_id AND status = 'pending'");
        $row = $result->fetch_assoc();
        
        // If no pending offers, set transfer back to pending
        if ($row['count'] == 0) {
            $conn->query("UPDATE transfers SET status = 'pending' WHERE transfer_id = $transfer_id");
        }
        
        echo json_encode(["success" => true, "message" => "Offer deleted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete offer"]);
    }
}

$conn->close();
?>
