/**
 * Example Management Page using EnhancedTable
 * This demonstrates all new features:
 * - Toast notifications
 * - Loading states
 * - Search, sort, filter
 * - Pagination
 * - Bulk delete
 * 
 * Copy this template for your own management pages
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  Avatar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EnhancedTable from '../components/EnhancedTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { showToast } from '../utils/toast';
import { bulkDelete } from '../services/api';

const ExampleEnhancedManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    name: '',
    email: '',
    status: 'active',
  });

  // Define table columns
  const columns = [
    {
      id: 'id',
      label: 'ID',
      sortable: true,
      align: 'center',
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {value?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="body2">{value}</Typography>
        </Box>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Chip
          label={value}
          color={value === 'active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Replace with your actual API call
      // const res = await getYourData();
      // Simulated data for example
      const mockData = [
        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', created_at: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', created_at: '2024-01-16' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', created_at: '2024-01-17' },
        { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'active', created_at: '2024-01-18' },
        { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'active', created_at: '2024-01-19' },
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData(mockData);
      showToast.success('Data loaded successfully');
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle add new
  const handleAdd = () => {
    setEditMode(false);
    setCurrentItem({
      id: null,
      name: '',
      email: '',
      status: 'active',
    });
    setOpenDialog(true);
  };

  // Handle edit
  const handleEdit = (item) => {
    setEditMode(true);
    setCurrentItem(item);
    setOpenDialog(true);
  };

  // Handle delete single
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      // Replace with your actual API call
      // await deleteYourItem(id);
      
      setData(data.filter(item => item.id !== id));
      showToast.success('Item deleted successfully');
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast.error('Failed to delete item');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async (selectedIds) => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) {
      return;
    }

    try {
      // Replace 'your_table' with your actual table name
      const res = await bulkDelete('your_table', selectedIds, 'id');
      
      if (res.data.success) {
        setData(data.filter(item => !selectedIds.includes(item.id)));
        showToast.success(`${res.data.deleted_count} items deleted successfully`);
      } else {
        showToast.error('Failed to delete items');
      }
    } catch (err) {
      console.error('Error deleting items:', err);
      showToast.error('Failed to delete items');
    }
  };

  // Handle save (add/edit)
  const handleSave = async () => {
    try {
      if (editMode) {
        // Replace with your actual API call
        // await updateYourItem(currentItem);
        
        setData(data.map(item => 
          item.id === currentItem.id ? currentItem : item
        ));
        showToast.success('Item updated successfully');
      } else {
        // Replace with your actual API call
        // const res = await addYourItem(currentItem);
        
        const newItem = {
          ...currentItem,
          id: Math.max(...data.map(d => d.id)) + 1,
          created_at: new Date().toISOString(),
        };
        setData([...data, newItem]);
        showToast.success('Item added successfully');
      }
      
      setOpenDialog(false);
    } catch (err) {
      console.error('Error saving item:', err);
      showToast.error('Failed to save item');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Example Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add New
        </Button>
      </Box>

      {/* Enhanced Table with all features */}
      <EnhancedTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        title="Items"
        enableSelection={true}
        enableSearch={true}
        enablePagination={true}
        defaultRowsPerPage={10}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={currentItem.name}
              onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={currentItem.email}
              onChange={(e) => setCurrentItem({ ...currentItem, email: e.target.value })}
              required
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={currentItem.status}
              onChange={(e) => setCurrentItem({ ...currentItem, status: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExampleEnhancedManagement;
