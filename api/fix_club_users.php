<?php
header("Content-Type: application/json");
include 'config.php';

echo "<h2>🔧 Fixing Club-User Relationships</h2>";

// 1. Check current clubs
echo "<h3>1. Current Clubs:</h3>";
$result = $conn->query("SELECT club_id, club_name, user_id, status FROM clubs");
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Club ID</th><th>Club Name</th><th>User ID</th><th>Status</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['club_id']}</td>";
    echo "<td>{$row['club_name']}</td>";
    echo "<td>" . ($row['user_id'] ?? 'NULL') . "</td>";
    echo "<td>{$row['status']}</td>";
    echo "</tr>";
}
echo "</table><br>";

// 2. Check current users
echo "<h3>2. Current Users:</h3>";
$result = $conn->query("SELECT user_id, name, email, role FROM users");
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['user_id']}</td>";
    echo "<td>{$row['name']}</td>";
    echo "<td>{$row['email']}</td>";
    echo "<td>{$row['role']}</td>";
    echo "</tr>";
}
echo "</table><br>";

// 3. Fix Arsenal - Link to Shimo user
echo "<h3>3. Fixing Arsenal Club:</h3>";
$stmt = $conn->prepare("
    UPDATE clubs 
    SET user_id = (SELECT user_id FROM users WHERE email = 'Shimo@gmail.com' LIMIT 1)
    WHERE club_name = 'Arsenal' AND user_id IS NULL
");
if ($stmt->execute()) {
    echo "✅ Arsenal linked to Shimo@gmail.com<br>";
} else {
    echo "❌ Failed to link Arsenal<br>";
}

// 4. Create user for Man City if not exists
echo "<h3>4. Creating Man City User:</h3>";
$email = 'mancity@gmail.com';
$stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    // Create new user
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)");
    $name = "Man City Manager";
    $password = "12345";
    $role = "club";
    $status = "active";
    $stmt->bind_param("sssss", $name, $email, $password, $role, $status);
    
    if ($stmt->execute()) {
        echo "✅ Created user: mancity@gmail.com (password: 12345)<br>";
    } else {
        echo "❌ Failed to create user<br>";
    }
} else {
    echo "ℹ️ User mancity@gmail.com already exists<br>";
}

// 5. Link Man City to its user
echo "<h3>5. Fixing Man City Club:</h3>";
$stmt = $conn->prepare("
    UPDATE clubs 
    SET user_id = (SELECT user_id FROM users WHERE email = 'mancity@gmail.com' LIMIT 1)
    WHERE club_name = 'Man City' AND user_id IS NULL
");
if ($stmt->execute()) {
    echo "✅ Man City linked to mancity@gmail.com<br>";
} else {
    echo "❌ Failed to link Man City<br>";
}

// 6. Show final result
echo "<h3>6. Final Result - Clubs with Users:</h3>";
$result = $conn->query("
    SELECT c.club_id, c.club_name, c.user_id, u.name as user_name, u.email, c.status
    FROM clubs c
    LEFT JOIN users u ON c.user_id = u.user_id
");
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Club ID</th><th>Club Name</th><th>User ID</th><th>User Name</th><th>Email</th><th>Status</th></tr>";
while ($row = $result->fetch_assoc()) {
    echo "<tr>";
    echo "<td>{$row['club_id']}</td>";
    echo "<td>{$row['club_name']}</td>";
    echo "<td>" . ($row['user_id'] ?? 'NULL') . "</td>";
    echo "<td>" . ($row['user_name'] ?? 'NULL') . "</td>";
    echo "<td>" . ($row['email'] ?? 'NULL') . "</td>";
    echo "<td>{$row['status']}</td>";
    echo "</tr>";
}
echo "</table><br>";

echo "<h3>✅ Done! You can now:</h3>";
echo "<ul>";
echo "<li>Login as <strong>Shimo@gmail.com</strong> (password: check database) to access Arsenal</li>";
echo "<li>Login as <strong>mancity@gmail.com</strong> (password: 12345) to access Man City</li>";
echo "</ul>";

$conn->close();
?>
