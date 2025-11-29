<?php
include 'api/config.php';
$result = $conn->query("SELECT club_id, club_name, status FROM clubs ORDER BY club_name");
echo "All clubs in database:\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['club_id'] . " | Name: " . $row['club_name'] . " | Status: " . $row['status'] . "\n";
}
?>
