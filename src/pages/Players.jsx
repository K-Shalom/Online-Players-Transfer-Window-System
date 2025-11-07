import React, { useEffect, useState } from 'react'
import { Typography, Box } from '@mui/material'
import DataTable from '../components/DataTable'
import { getPlayers } from '../services/api'

const columns = [
  { field: 'id', title: 'ID' },
  { field: 'name', title: 'Name' },
  { field: 'club', title: 'Club' },
  { field: 'value', title: 'Value' }
]

export default function Players(){
  const [rows, setRows] = useState([])

  useEffect(() => {
    let mounted = true
    getPlayers().then(data => { if(mounted) setRows(data) }).catch(() => {
      // fallback demo data when no backend
      if(mounted) setRows([
        { id: 1, name: 'John Doe', club: 'FC Demo', value: '€5M' },
        { id: 2, name: 'Jane Smith', club: 'Demo United', value: '€8M' }
      ])
    })
    return () => mounted = false
  }, [])

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Players</Typography>
      <DataTable columns={columns} rows={rows} />
    </Box>
  )
}
