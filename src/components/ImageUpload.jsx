import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Avatar,
  IconButton,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';

const ImageUpload = ({ 
  currentImage, 
  onImageChange, 
  label = "Upload Image",
  shape = "square", // "square" or "circle"
  size = 150,
  accept = "image/*"
}) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadstart = () => setUploading(true);
      reader.onloadend = () => {
        setPreview(reader.result);
        setUploading(false);
        // Pass both file and preview to parent
        onImageChange(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange(null, null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>

      <Paper
        elevation={2}
        sx={{
          width: size,
          height: size,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: shape === 'circle' ? '50%' : 2,
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: 4,
          },
        }}
        onClick={handleClick}
      >
        {uploading ? (
          <CircularProgress />
        ) : preview ? (
          <Box
            component="img"
            src={preview}
            alt="Preview"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Click to upload
            </Typography>
          </Box>
        )}
      </Paper>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadIcon />}
          onClick={handleClick}
        >
          {preview ? 'Change' : 'Upload'}
        </Button>
        {preview && (
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleRemove}
          >
            Remove
          </Button>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Max size: 5MB. Formats: JPG, PNG, GIF
      </Typography>
    </Box>
  );
};

export default ImageUpload;
