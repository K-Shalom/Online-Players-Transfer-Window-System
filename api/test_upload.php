<?php
header("Content-Type: application/json");
require_once 'upload_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = ['success' => false, 'message' => 'No file uploaded'];
    
    if (isset($_FILES['test_file']) && $_FILES['test_file']['error'] === UPLOAD_ERR_OK) {
        $uploadResult = uploadImage($_FILES['test_file'], 'clubs');
        $response = $uploadResult;
    } else {
        $response['debug'] = [
            'files' => $_FILES,
            'error' => $_FILES['test_file']['error'] ?? 'No file found'
        ];
    }
    
    echo json_encode($response);
} else {
    echo json_encode(['message' => 'Please use POST method to upload a file']);
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Test Upload</title>
</head>
<body>
    <h2>Test File Upload</h2>
    <form action="test_upload.php" method="post" enctype="multipart/form-data">
        <input type="file" name="test_file" accept="image/*">
        <button type="submit">Upload</button>
    </form>
</body>
</html>
