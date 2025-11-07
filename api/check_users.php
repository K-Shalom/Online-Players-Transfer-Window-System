<?php
include 'config.php';

echo "<h2>👥 All Users in System</h2>";

$result = $conn->query("SELECT user_id, name, email, password, role, status FROM users");

echo "<table border='1' cellpadding='10' style='border-collapse: collapse;'>";
echo "<tr style='background: #1976d2; color: white;'>";
echo "<th>User ID</th><th>Name</th><th>Email</th><th>Password</th><th>Role</th><th>Status</th>";
echo "</tr>";

while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['user_id']}</td>";
    echo "<td>{$row['name']}</td>";
    echo "<td><strong>{$row['email']}</strong></td>";
    echo "<td><code>{$row['password']}</code></td>";
    echo "<td><span style='background: " . ($row['role'] == 'admin' ? '#f44336' : '#4caf50') . "; color: white; padding: 3px 8px; border-radius: 3px;'>{$row['role']}</span></td>";
    echo "<td>{$row['status']}</td>";
    echo "</tr>";
}

echo "</table>";

echo "<br><h3>🔑 Login Credentials:</h3>";
echo "<ul>";
echo "<li><strong>Admin:</strong> shalom@gmail.com / 12345</li>";
echo "<li><strong>Arsenal (Shimo):</strong> Shimo@gmail.com / (check password above)</li>";
echo "<li><strong>Man City (blaise):</strong> blaise@gmail.com / (check password above)</li>";
echo "</ul>";

$conn->close();
?>
