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

// Get total clubs
$clubsQuery = "SELECT COUNT(*) as total FROM clubs";
$clubsResult = $conn->query($clubsQuery);
$totalClubs = $clubsResult->fetch_assoc()['total'];

// Get total players
$playersQuery = "SELECT COUNT(*) as total FROM players WHERE status='active'";
$playersResult = $conn->query($playersQuery);
$totalPlayers = $playersResult->fetch_assoc()['total'];

// Get active transfers
$transfersQuery = "SELECT COUNT(*) as total FROM transfers WHERE status IN ('pending', 'negotiation', 'accepted')";
$transfersResult = $conn->query($transfersQuery);
$activeTransfers = $transfersResult->fetch_assoc()['total'];

// Get pending club approvals
$pendingClubsQuery = "SELECT COUNT(*) as total FROM clubs WHERE status='pending'";
$pendingClubsResult = $conn->query($pendingClubsQuery);
$pendingApprovals = $pendingClubsResult->fetch_assoc()['total'];

echo json_encode([
    "success" => true,
    "data" => [
        "totalClubs" => (int)$totalClubs,
        "totalPlayers" => (int)$totalPlayers,
        "activeTransfers" => (int)$activeTransfers,
        "pendingApprovals" => (int)$pendingApprovals
    ]
]);
?>
