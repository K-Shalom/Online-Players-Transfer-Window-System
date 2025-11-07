import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function Footer(){
  return (
    <Box component="footer" sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #eee' }}>
      <Typography variant="caption">© {new Date().getFullYear()} OPTW System</Typography>
    </Box>
  )
}
