# 🖼️ Image Upload with Preview - Implementation Complete!

## ✅ What's Been Implemented

### 1. **Reusable ImageUpload Component**
**File:** `src/components/ImageUpload.jsx`

**Features:**
- ✅ Click to upload image
- ✅ Live preview of selected image
- ✅ Drag & drop support (visual feedback)
- ✅ File type validation (JPG, PNG, GIF, WEBP)
- ✅ File size validation (max 5MB)
- ✅ Change/Remove buttons
- ✅ Loading state during upload
- ✅ Circular or square shape
- ✅ Customizable size
- ✅ Base64 encoding for preview

**Props:**
```jsx
<ImageUpload
  currentImage={imageUrl}           // Current image URL
  onImageChange={(file, preview) => {}} // Callback with file and preview
  label="Upload Image"              // Label text
  shape="circle"                    // "circle" or "square"
  size={150}                        // Size in pixels
  accept="image/*"                  // Accepted file types
/>
```

---

### 2. **Player Form with Image Upload**
**File:** `src/pages/PlayersManagementDataGrid.jsx`

**Added:**
- ✅ Player photo upload (circular shape, 120px)
- ✅ Preview of current photo
- ✅ State management for photo file and preview
- ✅ Photo displayed at top of form

**Usage:**
```jsx
<ImageUpload
  currentImage={playerPhotoPreview}
  onImageChange={(file, preview) => {
    setPlayerPhoto(file);
    setPlayerPhotoPreview(preview);
  }}
  label="Player Photo"
  shape="circle"
  size={120}
/>
```

---

### 3. **Club Form with Image Upload**
**File:** `src/pages/ClubsManagement.jsx`

**Added:**
- ✅ Club logo upload (square shape, 150px)
- ✅ Preview of current logo
- ✅ State management for logo file and preview
- ✅ Logo displayed at top of form

**Usage:**
```jsx
<ImageUpload
  currentImage={clubLogoPreview}
  onImageChange={(file, preview) => {
    setClubLogo(file);
    setClubLogoPreview(preview);
  }}
  label="Club Logo"
  shape="square"
  size={150}
/>
```

---

### 4. **Backend Upload Infrastructure**

**Folders Created:**
- ✅ `api/uploads/players/` - Player photos
- ✅ `api/uploads/clubs/` - Club logos
- ✅ `api/uploads/.htaccess` - CORS and access control

**Upload Helper:**
- ✅ `api/upload_helper.php` - PHP upload functions

**Functions:**
1. `uploadImage($file, $folder)` - Handle $_FILES upload
2. `deleteImage($url)` - Delete old image
3. `handleBase64Upload($base64Data, $folder)` - Handle base64 upload

---

## 🎨 Component Features

### Visual Design
```
┌─────────────────────┐
│   Upload Image      │  ← Label
├─────────────────────┤
│                     │
│   ┌───────────┐     │
│   │           │     │
│   │  Preview  │     │  ← Image preview or camera icon
│   │           │     │
│   └───────────┘     │
│                     │
├─────────────────────┤
│ [Upload] [Remove]   │  ← Action buttons
├─────────────────────┤
│ Max size: 5MB       │  ← Help text
└─────────────────────┘
```

### States

**1. Empty State (No Image)**
- Camera icon displayed
- "Click to upload" text
- Only "Upload" button visible

**2. Loading State**
- Circular progress spinner
- Buttons disabled

**3. Preview State (Image Selected)**
- Image preview displayed
- Both "Change" and "Remove" buttons visible
- Hover effect (scale 1.05)

---

## 🔧 How It Works

### Frontend Flow

**1. User Selects Image:**
```javascript
// User clicks or selects file
const file = event.target.files[0];

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
```

**2. Create Preview:**
```javascript
// Read file as base64
const reader = new FileReader();
reader.onloadend = () => {
  setPreview(reader.result);  // base64 string
  onImageChange(file, reader.result);
};
reader.readAsDataURL(file);
```

**3. Parent Component Receives:**
```javascript
onImageChange={(file, preview) => {
  setPlayerPhoto(file);          // File object for upload
  setPlayerPhotoPreview(preview); // Base64 for preview
}}
```

---

### Backend Flow (To Be Implemented)

**Option 1: FormData Upload**
```javascript
// In handleSubmit
const formData = new FormData();
formData.append('name', currentPlayer.name);
formData.append('age', currentPlayer.age);
// ... other fields
if (playerPhoto) {
  formData.append('photo', playerPhoto);
}

// Send to API
await axios.post('api/players.php', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**PHP Handler:**
```php
// In players.php
include 'upload_helper.php';

if (isset($_FILES['photo'])) {
  $uploadResult = uploadImage($_FILES['photo'], 'players');
  if ($uploadResult['success']) {
    $photo_url = $uploadResult['url'];
  }
}
```

**Option 2: Base64 Upload**
```javascript
// Send base64 directly
await axios.post('api/players.php', {
  ...currentPlayer,
  photo_base64: playerPhotoPreview
});
```

**PHP Handler:**
```php
// In players.php
include 'upload_helper.php';

if (!empty($data['photo_base64'])) {
  $uploadResult = handleBase64Upload($data['photo_base64'], 'players');
  if ($uploadResult['success']) {
    $photo_url = $uploadResult['url'];
  }
}
```

---

## 📊 File Structure

```
optw_system/
├── src/
│   ├── components/
│   │   └── ImageUpload.jsx          ← Reusable component
│   └── pages/
│       ├── PlayersManagementDataGrid.jsx  ← With player photo
│       └── ClubsManagement.jsx            ← With club logo
├── api/
│   ├── uploads/
│   │   ├── players/                 ← Player photos
│   │   ├── clubs/                   ← Club logos
│   │   └── .htaccess                ← Access control
│   ├── upload_helper.php            ← Upload functions
│   ├── players.php                  ← To be updated
│   └── clubs.php                    ← To be updated
```

---

## 🎮 How to Use

### For Admin Users:

**1. Add Player with Photo:**
- Click "Add Player" button
- Click on camera icon or "Upload" button
- Select image file (JPG, PNG, GIF, WEBP)
- See preview immediately
- Fill other fields
- Click "Add Player"

**2. Edit Player Photo:**
- Click edit icon on player row
- See current photo (if exists)
- Click "Change" to select new photo
- Or click "Remove" to delete photo
- Click "Update Player"

**3. Add Club with Logo:**
- Click "Add Club" button
- Click on camera icon or "Upload" button
- Select logo file
- See preview immediately
- Fill other fields
- Click "Add Club"

**4. Edit Club Logo:**
- Click edit icon on club row
- See current logo (if exists)
- Click "Change" to select new logo
- Or click "Remove" to delete logo
- Click "Update Club"

---

## ✅ Validation

### File Type Validation
```javascript
// Only image files allowed
accept="image/*"

// Checked in component
if (!file.type.startsWith('image/')) {
  alert('Please select an image file');
  return;
}
```

### File Size Validation
```javascript
// Max 5MB
if (file.size > 5 * 1024 * 1024) {
  alert('File size must be less than 5MB');
  return;
}
```

### PHP Validation
```php
// In upload_helper.php
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB
```

---

## 🎨 Customization

### Different Shapes
```jsx
// Circular (for player photos)
<ImageUpload shape="circle" size={120} />

// Square (for club logos)
<ImageUpload shape="square" size={150} />
```

### Different Sizes
```jsx
// Small
<ImageUpload size={80} />

// Medium
<ImageUpload size={120} />

// Large
<ImageUpload size={200} />
```

### Custom Labels
```jsx
<ImageUpload label="Profile Picture" />
<ImageUpload label="Team Logo" />
<ImageUpload label="Stadium Photo" />
```

---

## 🔄 Next Steps

### 1. Update Players API
**File:** `api/players.php`

Add to POST/PUT handlers:
```php
include 'upload_helper.php';

// Handle photo upload
$photo_url = null;
if (isset($_FILES['photo'])) {
  $uploadResult = uploadImage($_FILES['photo'], 'players');
  if ($uploadResult['success']) {
    $photo_url = $uploadResult['url'];
  }
}

// Or handle base64
if (!empty($data['photo_base64'])) {
  $uploadResult = handleBase64Upload($data['photo_base64'], 'players');
  if ($uploadResult['success']) {
    $photo_url = $uploadResult['url'];
  }
}

// Update query to include photo_url
$stmt = $conn->prepare("INSERT INTO players (..., photo_url) VALUES (..., ?)");
```

### 2. Update Clubs API
**File:** `api/clubs.php`

Add to POST/PUT handlers:
```php
include 'upload_helper.php';

// Handle logo upload
$logo_url = null;
if (isset($_FILES['logo'])) {
  $uploadResult = uploadImage($_FILES['logo'], 'clubs');
  if ($uploadResult['success']) {
    $logo_url = $uploadResult['url'];
  }
}

// Or handle base64
if (!empty($data['logo_base64'])) {
  $uploadResult = handleBase64Upload($data['logo_base64'], 'clubs');
  if ($uploadResult['success']) {
    $logo_url = $uploadResult['url'];
  }
}

// Update query to include logo_url
$stmt = $conn->prepare("UPDATE clubs SET ..., logo_url=? WHERE club_id=?");
```

### 3. Update Frontend Submit Functions

**PlayersManagementDataGrid.jsx:**
```javascript
const handleSubmit = async () => {
  // Option 1: FormData
  const formData = new FormData();
  Object.keys(currentPlayer).forEach(key => {
    formData.append(key, currentPlayer[key]);
  });
  if (playerPhoto) {
    formData.append('photo', playerPhoto);
  }
  
  // Send with axios
  await axios.post(API_URL + 'players.php', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  // Option 2: Base64
  const playerData = {
    ...currentPlayer,
    photo_base64: playerPhotoPreview
  };
  await addPlayer(playerData);
};
```

### 4. Display Images in DataGrid

Add avatar column:
```javascript
{
  field: 'photo_url',
  headerName: 'Photo',
  width: 80,
  renderCell: (params) => (
    <Avatar
      src={params.value}
      alt={params.row.name}
      sx={{ width: 40, height: 40 }}
    >
      {params.row.name[0]}
    </Avatar>
  ),
}
```

---

## 📝 Testing Checklist

- [ ] **Upload new player photo**
  - Select image file
  - See preview
  - Submit form
  - Photo saved to database

- [ ] **Edit player photo**
  - Open edit dialog
  - See current photo
  - Change photo
  - Submit form
  - New photo saved

- [ ] **Remove player photo**
  - Open edit dialog
  - Click "Remove" button
  - Preview clears
  - Submit form
  - Photo removed from database

- [ ] **Upload club logo**
  - Select logo file
  - See preview
  - Submit form
  - Logo saved

- [ ] **File validation**
  - Try uploading non-image file (should fail)
  - Try uploading large file >5MB (should fail)
  - Try uploading valid image (should succeed)

- [ ] **Preview functionality**
  - Preview shows immediately after selection
  - Preview persists when editing existing record
  - Preview clears when removing image

---

## 🎉 Summary

**What You Have:**
- ✅ Reusable ImageUpload component
- ✅ Player photo upload with preview
- ✅ Club logo upload with preview
- ✅ File validation (type & size)
- ✅ Loading states
- ✅ Change/Remove functionality
- ✅ Circular and square shapes
- ✅ Upload folders created
- ✅ PHP upload helper functions
- ✅ CORS configuration

**What's Next:**
- 🔲 Update players.php API to handle uploads
- 🔲 Update clubs.php API to handle uploads
- 🔲 Update frontend submit functions
- 🔲 Display images in DataGrid
- 🔲 Test full upload flow

**Benefits:**
- ⭐ Professional image upload UX
- ⭐ Live preview before submit
- ⭐ Validation prevents errors
- ⭐ Reusable component
- ⭐ Easy to customize

---

**Image upload component is ready! Test it by adding/editing players and clubs!** 🖼️🚀

