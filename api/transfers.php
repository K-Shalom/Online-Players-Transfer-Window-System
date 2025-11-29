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
include 'pdf_generator.php';

$tw_helpers_defined = true;
if (!function_exists('tw_ensure')) {
    function tw_ensure($conn) {
        $check = $conn->query("SHOW TABLES LIKE 'transfer_windows'");
        if (!$check || $check->num_rows === 0) {
            $conn->query("CREATE TABLE IF NOT EXISTS transfer_windows (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, start_at DATETIME NOT NULL, end_at DATETIME NOT NULL, is_open TINYINT(1) DEFAULT 0, created_by INT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        }
    }
}

if (!function_exists('tw_is_open')) {
    function tw_is_open($conn) {
        tw_ensure($conn);
        $sql = "SELECT id FROM transfer_windows WHERE is_open = 1 AND start_at <= NOW() AND end_at >= NOW() LIMIT 1";
        $res = $conn->query($sql);
        return ($res && $res->num_rows > 0);
    }
}

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

// GET - Fetch all transfers or single transfer
if ($method === 'GET') {
    $currentUser = getCurrentUser();
    
    if (!$currentUser) {
        echo json_encode(["success" => false, "message" => "Authentication required"]);
        exit;
    }
    
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
    if (!tw_is_open($conn)) {
        echo json_encode(["success" => false, "message" => "Transfer window is closed. Transfers cannot be created now."]);
        exit;
    }
    
    $playerId = $data['player_id'] ?? null;
    $buyerClubId = $data['buyer_club_id'] ?? null;
    $type = $data['type'] ?? 'Permanent';
    $amount = isset($data['amount']) ? floatval($data['amount']) : 0;
    $status = $data['status'] ?? 'pending';
    
    if (!$playerId || !$buyerClubId) {
        echo json_encode(["success" => false, "message" => "Player and buyer club are required"]);
        exit;
    }

    // Fetch player club to prevent tampering and enforce rules
    $playerStmt = $conn->prepare("SELECT club_id FROM players WHERE player_id = ?");
    $playerStmt->bind_param("i", $playerId);
    $playerStmt->execute();
    $playerResult = $playerStmt->get_result();
    $playerData = $playerResult->fetch_assoc();
    if (!$playerData) {
        echo json_encode(["success" => false, "message" => "Player not found"]);
        exit;
    }

    $sellerClubId = $playerData['club_id'] !== null ? intval($playerData['club_id']) : null;

    if ($sellerClubId !== null && $sellerClubId == $buyerClubId) {
        echo json_encode(["success" => false, "message" => "Player cannot transfer to the same club"]);
        exit;
    }

    if ($type === 'Permanent') {
        if ($amount <= 0) {
            echo json_encode(["success" => false, "message" => "Amount is required for permanent transfers"]);
            exit;
        }
    } else {
        // For loan or free transfers, amount is optional. Force 0 for free transfers.
        if ($type === 'Free') {
            $amount = 0;
        } elseif ($amount < 0) {
            $amount = 0;
        }
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
        if (in_array($status, ['accepted','completed']) && !tw_is_open($conn)) {
            echo json_encode(["success" => false, "message" => "Transfer window is closed. Status update not allowed."]);
            exit;
        }
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
        // If transfer is completed, update player's club and generate PDF
        if ($status === 'completed') {
            $getTransfer = $conn->prepare("SELECT t.*, p.name as player_name, p.position, p.age, p.nationality, 
                                                 sc.club_name as seller_club, bc.club_name as buyer_club 
                                                 FROM transfers t 
                                                 LEFT JOIN players p ON t.player_id = p.player_id
                                                 LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
                                                 LEFT JOIN clubs bc ON t.buyer_club_id = bc.club_id
                                                 WHERE t.transfer_id=?");
            $getTransfer->bind_param("i", $transferId);
            $getTransfer->execute();
            $transferData = $getTransfer->get_result()->fetch_assoc();
            
            if ($transferData) {
                // Update player's club
                $updatePlayer = $conn->prepare("UPDATE players SET club_id=? WHERE player_id=?");
                $updatePlayer->bind_param("ii", $transferData['buyer_club_id'], $transferData['player_id']);
                $updatePlayer->execute();
                
                // Generate PDF agreement
                $pdfData = [
                    'transfer_id' => $transferId,
                    'transfer_type' => $transferData['type'],
                    'transfer_fee' => number_format($transferData['amount'], 2),
                    'player_name' => $transferData['player_name'],
                    'position' => $transferData['position'],
                    'age' => $transferData['age'],
                    'nationality' => $transferData['nationality'],
                    'seller_club' => $transferData['seller_club'],
                    'buyer_club' => $transferData['buyer_club'],
                    'contract_duration' => '3', // Default duration
                    'contract_start' => date('Y-m-d'),
                    'contract_end' => date('Y-m-d', strtotime('+3 years')),
                    'weekly_salary' => 'To be determined',
                    'signing_bonus' => 'To be determined',
                    'performance_bonuses' => 'To be determined',
                    'market_value' => number_format($transferData['amount'], 2),
                    'league' => 'Premier League',
                    'season' => date('Y')
                ];
                
                $pdfGenerator = generateTransferAgreement($pdfData);
                if ($pdfGenerator) {
                    $pdfFilename = 'transfer_agreement_' . $transferId . '_' . time() . '.pdf';
                    $pdfPath = 'agreements/' . $pdfFilename;
                    
                    // Create agreements directory if it doesn't exist
                    if (!is_dir('agreements')) {
                        mkdir('agreements', 0777, true);
                    }
                    
                    if ($pdfGenerator->savePDF($pdfPath)) {
                        // Save PDF path to database
                        $updatePdf = $conn->prepare("UPDATE transfers SET agreement_pdf=? WHERE transfer_id=?");
                        $updatePdf->bind_param("si", $pdfPath, $transferId);
                        $updatePdf->execute();
                    }
                }
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
