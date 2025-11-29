<?php
$host = "localhost";
$dbname = "optw_system";
$username = "root"; // MySQL user
$password = "";     // MySQL password

$conn = new mysqli($host, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["success"=>false,"message"=>$conn->connect_error]));
}
$conn->query("SET time_zone = '+02:00'");
?>
