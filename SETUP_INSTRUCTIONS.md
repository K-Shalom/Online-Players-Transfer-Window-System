# Quick Setup Instructions

## 🚀 Getting Started

### 1. Database Migration
Run this SQL script to add email verification support:

```sql
-- File: database/migrations/add_email_verification.sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) DEFAULT 0 AFTER email,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL AFTER email_verified,
ADD COLUMN IF NOT EXISTS token_expiry DATETIME NULL AFTER verification_token;

-- Optional: Set existing users as verified
UPDATE users SET email_verified = 1;

CREATE INDEX IF NOT EXISTS idx_verification_token ON users(verification_token);
```

### 2. Install Dependencies
The `react-toastify` package has already been installed. If you need to reinstall:

```bash
npm install
```

### 3. Start the Application

**Backend (XAMPP):**
- Start Apache and MySQL
- Ensure database is running

**Frontend:**
```bash
npm run dev
```

## 📋 Quick Feature Reference

### Toast Notifications
```javascript
import { showToast } from '../utils/toast';

showToast.success('Success message');
showToast.error('Error message');
showToast.info('Info message');
showToast.warning('Warning message');
```

### Loading Spinner
```javascript
import LoadingSpinner from '../components/LoadingSpinner';

<LoadingSpinner message="Loading..." />
<LoadingSpinner message="Processing..." fullScreen={true} />
```

### Enhanced Table (with search, sort, pagination, bulk delete)
```javascript
import EnhancedTable from '../components/EnhancedTable';

const columns = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'email', label: 'Email', sortable: true },
];

<EnhancedTable
  columns={columns}
  data={myData}
  loading={loading}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onBulkDelete={handleBulkDelete}
  title="My Table"
/>
```

### Pagination
```javascript
import Pagination from '../components/Pagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={setRowsPerPage}
  totalItems={totalItems}
/>
```

### Bulk Delete API
```javascript
import { bulkDelete } from '../services/api';

const handleBulkDelete = async (selectedIds) => {
  const res = await bulkDelete('players', selectedIds, 'player_id');
  if (res.data.success) {
    showToast.success(`${res.data.deleted_count} records deleted`);
  }
};
```

## ✅ Features Implemented

1. ✅ **Toast Messages** - Notifications for all user actions
2. ✅ **Session Lockout** - Auto-logout after 15 minutes inactivity
3. ✅ **Email Verification** - Users must verify email before login
4. ✅ **Loading Spinners** - Visual feedback during operations
5. ✅ **Button Loading States** - Submit buttons show loading state
6. ✅ **Search & Filter** - Real-time search in tables
7. ✅ **Sorting** - Click column headers to sort
8. ✅ **Dashboard Avatar** - User profile with avatar
9. ✅ **Pagination** - Navigate through large datasets
10. ✅ **Bulk Delete** - Select and delete multiple records

## 🔧 Configuration

### Session Timeout
Edit `src/context/SessionContext.jsx`:
```javascript
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes warning
```

### API URL
Edit `src/services/api.js`:
```javascript
const API_URL = 'http://localhost/optw_system/api/';
```

## 📖 Full Documentation
See `FEATURES_IMPLEMENTATION.md` for complete documentation.

## 🐛 Common Issues

**Email verification not working?**
- Run the database migration script
- Check that new columns exist in users table

**Session timeout not working?**
- Ensure SessionProvider wraps your app in App.jsx
- Check browser console for errors

**Toast not showing?**
- Verify ToastContainer is in App.jsx
- Check that react-toastify CSS is imported

**Bulk delete failing?**
- Verify table name is in the whitelist (api/bulk_delete.php)
- Check that IDs are valid integers

## 🎯 Testing

1. **Signup Flow**: Create account → Check console for verification link → Verify email → Login
2. **Session Timeout**: Login → Wait 13 minutes → See warning toast → Wait 2 more minutes → Auto logout
3. **Bulk Delete**: Go to any management page → Select multiple rows → Click delete icon
4. **Search/Sort**: Use search box → Click column headers to sort
5. **Pagination**: Navigate through pages → Change rows per page

All features are ready to use!
