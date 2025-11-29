<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'config.php';

// Get recent transfers with player and club details
$query = "SELECT 
    t.transfer_id,
    t.amount,
    t.status,
    t.type,
    t.created_at,
    p.name as player_name,
    sc.club_name as seller_club,
    bc.club_name as buyer_club
FROM transfers t
LEFT JOIN players p ON t.player_id = p.player_id
LEFT JOIN clubs sc ON t.seller_club_id = sc.club_id
LEFT JOIN clubs bc ON t.buyer_club_id = bc.club_id
ORDER BY t.created_at DESC
LIMIT 10";

$result = $conn->query($query);
$transfers = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $transfers[] = [
            'id' => $row['transfer_id'],
            'player' => $row['player_name'] ?? 'Unknown Player',
            'from' => $row['seller_club'] ?? 'Unknown Club',
            'to' => $row['buyer_club'] ?? 'Unknown Club',
            'amount' => $row['amount'] ? '$' . number_format($row['amount'], 2) : 'N/A',
            'status' => $row['status'],
            'type' => $row['type'],
            'date' => $row['created_at']
        ];
    }
}

echo json_encode([
    "success" => true,
    "data" => $transfers
]);
?>
