<?php
/**
 * Image Upload Helper
 * Handles file uploads for players and clubs
 */

function uploadImage($file, $folder = 'players') {
    $response = ['success' => false, 'message' => '', 'url' => null];
    
    // Check if file was uploaded
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        $response['message'] = 'No file uploaded or upload error';
        return $response;
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = $file['type'];
    
    if (!in_array($fileType, $allowedTypes)) {
        $response['message'] = 'Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed';
        return $response;
    }
    
    // Validate file size (max 5MB)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        $response['message'] = 'File size must be less than 5MB';
        return $response;
    }
    
    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    
    // Set upload directory
    $uploadDir = __DIR__ . '/uploads/' . $folder . '/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Move uploaded file
    $targetPath = $uploadDir . $filename;
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // Return URL relative to API folder
        $response['success'] = true;
        $response['url'] = 'http://localhost/Online-Players-Transfer-Window-System/api/uploads/' . $folder . '/' . $filename;
        $response['message'] = 'File uploaded successfully';
    } else {
        $response['message'] = 'Failed to move uploaded file';
    }
    
    return $response;
}

function deleteImage($url) {
    if (empty($url)) return true;
    
    // Extract filename from URL
    $path = parse_url($url, PHP_URL_PATH);
    $filename = basename($path);
    $folder = basename(dirname($path));
    
    $filePath = __DIR__ . '/uploads/' . $folder . '/' . $filename;
    
    if (file_exists($filePath)) {
        return unlink($filePath);
    }
    
    return true;
}

function handleBase64Upload($base64Data, $folder = 'players') {
    $response = ['success' => false, 'message' => '', 'url' => null];
    
    // Check if data is base64
    if (strpos($base64Data, 'data:image') !== 0) {
        $response['message'] = 'Invalid base64 image data';
        return $response;
    }
    
    // Extract image data
    list($type, $data) = explode(';', $base64Data);
    list(, $data) = explode(',', $data);
    $data = base64_decode($data);
    
    // Get image type
    $imageType = str_replace('data:image/', '', $type);
    
    // Validate image type
    $allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
    if (!in_array($imageType, $allowedTypes)) {
        $response['message'] = 'Invalid image type';
        return $response;
    }
    
    // Generate unique filename
    $filename = uniqid() . '_' . time() . '.' . $imageType;
    
    // Set upload directory
    $uploadDir = __DIR__ . '/uploads/' . $folder . '/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Save file
    $targetPath = $uploadDir . $filename;
    if (file_put_contents($targetPath, $data)) {
        $response['success'] = true;
        $response['url'] = 'http://localhost/Online-Players-Transfer-Window-System/api/uploads/' . $folder . '/' . $filename;
        $response['message'] = 'Image uploaded successfully';
    } else {
        $response['message'] = 'Failed to save image';
    }
    
    return $response;
}
?>
