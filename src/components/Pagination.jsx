import React from 'react';
import { Box, Pagination as MuiPagination, Typography, Select, MenuItem, FormControl } from '@mui/material';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  rowsPerPage = 10, 
  onRowsPerPageChange,
  totalItems = 0 
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalItems);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 2,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="textSecondary">
          Showing {startItem}-{endItem} of {totalItems}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {onRowsPerPageChange && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Rows per page:
            </Typography>
            <FormControl size="small">
              <Select
                value={rowsPerPage}
                onChange={(e) => onRowsPerPageChange(e.target.value)}
                sx={{ minWidth: 70 }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        <MuiPagination
          count={totalPages}
          page={currentPage}
          onChange={(event, page) => onPageChange(page)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default Pagination;
