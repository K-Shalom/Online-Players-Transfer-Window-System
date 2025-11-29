<?php
include 'api/config.php';
// Delete the pending Arsenal (ID 16)
$conn->query("DELETE FROM clubs WHERE club_id = 16");
echo "Deleted duplicate Arsenal club (ID 16)\n";

// Verify
$result = $conn->query("SELECT club_id, club_name, status FROM clubs ORDER BY club_name");
echo "\nRemaining clubs:\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['club_id'] . " | Name: " . $row['club_name'] . " | Status: " . $row['status'] . "\n";
}
?>
