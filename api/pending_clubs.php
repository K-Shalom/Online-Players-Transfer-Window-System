<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

include 'config.php';

// Handle GET request - fetch pending clubs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $query = "SELECT 
        club_id,
        club_name,
        country,
        manager,
        contact,
        license_no,
        created_at
    FROM clubs
    WHERE status='pending'
    ORDER BY created_at DESC";

    $result = $conn->query($query);
    $clubs = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $clubs[] = [
                'id' => $row['club_id'],
                'name' => $row['club_name'],
                'country' => $row['country'],
                'manager' => $row['manager'],
                'contact' => $row['contact'],
                'license_no' => $row['license_no'],
                'created_at' => $row['created_at']
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "data" => $clubs
    ]);
}

// Handle POST request - approve or reject club
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $clubId = $data['club_id'] ?? null;
    $action = $data['action'] ?? null; // 'approve' or 'reject'

    if (!$clubId || !$action) {
        echo json_encode(["success" => false, "message" => "Club ID and action required"]);
        exit;
    }

    if ($action === 'approve') {
        $stmt = $conn->prepare("UPDATE clubs SET status='approved' WHERE club_id=?");
        $stmt->bind_param("i", $clubId);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Club approved successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to approve club"]);
        }
    } elseif ($action === 'reject') {
        // For rejection, you might want to delete or mark differently
        $stmt = $conn->prepare("DELETE FROM clubs WHERE club_id=?");
        $stmt->bind_param("i", $clubId);
        
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Club rejected successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to reject club"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
    }
}
?>
