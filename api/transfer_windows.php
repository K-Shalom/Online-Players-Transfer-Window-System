<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include 'config.php';

function ensure_table_exists($conn) {
    $check = $conn->query("SHOW TABLES LIKE 'transfer_windows'");
    if (!$check || $check->num_rows === 0) {
        $sql = "CREATE TABLE IF NOT EXISTS transfer_windows (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            start_at DATETIME NOT NULL,
            end_at DATETIME NOT NULL,
            is_open TINYINT(1) DEFAULT 0,
            created_by INT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci";
        $conn->query($sql);
    }
}

function get_current_window($conn) {
    ensure_table_exists($conn);
    $sql = "SELECT * FROM transfer_windows WHERE is_open = 1 AND start_at <= NOW() AND end_at >= NOW() ORDER BY start_at DESC LIMIT 1";
    $res = $conn->query($sql);
    return $res && $res->num_rows > 0 ? $res->fetch_assoc() : null;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    ensure_table_exists($conn);

    if (isset($_GET['current']) && $_GET['current'] === 'true') {
        $win = get_current_window($conn);
        echo json_encode(["success" => true, "data" => $win, "open" => $win !== null]);
        exit;
    }

    if (isset($_GET['status']) && $_GET['status'] === 'active') {
        $sql = "SELECT * FROM transfer_windows WHERE is_open = 1 AND start_at <= NOW() AND end_at >= NOW() ORDER BY start_at DESC";
        $result = $conn->query($sql);
        $rows = [];
        if ($result) { while ($r = $result->fetch_assoc()) { $rows[] = $r; } }
        echo json_encode(["success" => true, "data" => $rows]);
        exit;
    }

    $result = $conn->query("SELECT * FROM transfer_windows ORDER BY created_at DESC");
    $rows = [];
    if ($result) { while ($r = $result->fetch_assoc()) { $rows[] = $r; } }
    echo json_encode(["success" => true, "data" => $rows]);
}
elseif ($method === 'POST') {
    ensure_table_exists($conn);
    $data = json_decode(file_get_contents("php://input"), true);

    $start_at = trim($data['start_at'] ?? '');
    $end_at = trim($data['end_at'] ?? '');
    $is_open = isset($data['is_open']) ? (int)!!$data['is_open'] : 0;
    // Handle created_by safely
    $created_by = isset($data['created_by']) && $data['created_by'] !== '' ? intval($data['created_by']) : null;

    if (!$start_at || !$end_at) {
        echo json_encode(["success" => false, "message" => "start_at and end_at are required"]);
        exit;
    }
    if (strtotime($start_at) >= strtotime($end_at)) {
        echo json_encode(["success" => false, "message" => "start_at must be before end_at"]);
        exit;
    }

    if ($is_open === 1) { $conn->query("UPDATE transfer_windows SET is_open = 0"); }

    $stmt = $conn->prepare("INSERT INTO transfer_windows (start_at, end_at, is_open, created_by) VALUES (?,?,?,?)");
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
        exit;
    }

    // Handle NULL created_by properly
    if ($created_by === null) {
        // For NULL values, we still need to pass a variable, but it can be null
        $null_val = null;
        $stmt->bind_param("ssii", $start_at, $end_at, $is_open, $null_val);
    } else {
        $stmt->bind_param("ssii", $start_at, $end_at, $is_open, $created_by);
    }

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Transfer window created", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create transfer window: " . $stmt->error]);
    }
}
elseif ($method === 'PUT') {
    ensure_table_exists($conn);
    $data = json_decode(file_get_contents("php://input"), true);

    $id = isset($data['id']) ? intval($data['id']) : null;
    $action = $data['action'] ?? '';

    if ($action === 'close_current') {
        $conn->query("UPDATE transfer_windows SET is_open = 0 WHERE is_open = 1");
        echo json_encode(["success" => true, "message" => "Current transfer window closed"]);
        exit;
    }

    if (!$id) {
        echo json_encode(["success" => false, "message" => "Window ID required"]);
        exit;
    }

    $fields = [];
    $types = '';
    $params = [];

    if (isset($data['start_at'])) { $fields[] = 'start_at = ?'; $types .= 's'; $params[] = trim($data['start_at']); }
    if (isset($data['end_at'])) { $fields[] = 'end_at = ?'; $types .= 's'; $params[] = trim($data['end_at']); }
    if (isset($data['is_open'])) { $fields[] = 'is_open = ?'; $types .= 'i'; $params[] = (int)!!$data['is_open']; }

    if (empty($fields)) {
        echo json_encode(["success" => false, "message" => "No update fields provided"]);
        exit;
    }

    if (in_array('is_open = ?', $fields) && (int)end($params) === 1) {
        $conn->query("UPDATE transfer_windows SET is_open = 0");
    }

    $sql = "UPDATE transfer_windows SET ".implode(', ', $fields)." WHERE id = ?";
    $types .= 'i';
    $params[] = $id;

    $stmt = $conn->prepare($sql);
    $bind = [$types];
    for ($i = 0; $i < count($params); $i++) { $bind[] = &$params[$i]; }
    call_user_func_array([$stmt, 'bind_param'], $bind);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Transfer window updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update transfer window"]);
    }
}
elseif ($method === 'DELETE') {
    ensure_table_exists($conn);
    $data = json_decode(file_get_contents("php://input"), true);

    $id = isset($data['id']) ? intval($data['id']) : 0;
    if (!$id) {
        echo json_encode(["success" => false, "message" => "Window ID required"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM transfer_windows WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Transfer window deleted"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete transfer window"]);
    }
}

$conn->close();
?>
