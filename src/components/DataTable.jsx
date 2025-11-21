import React from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'

const tableContainerStyle = {
  width: '100%',
  overflowX: 'auto',
}

const tableStyle = {
  minWidth: '100%',
  tableLayout: 'auto',
}

export default function DataTable({ columns = [], rows = [] }){
  return (
    <TableContainer component={Paper} sx={tableContainerStyle}>
      <Table sx={tableStyle} size="small">
        <TableHead>
          <TableRow>
            {columns.map(c => (
              <TableCell 
                key={c.field}
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: '12px 16px',
                }}
              >
                {c.title}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx}>
              {columns.map(c => (
              <TableCell 
                key={c.field}
                sx={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(224, 224, 224, 0.7)',
                }}
              >
                {r[c.field]}
              </TableCell>
            ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
