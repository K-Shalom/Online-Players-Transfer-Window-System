import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Dashboard, People, SwapHoriz, LocalOffer, BarChart } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Players', icon: <People />, path: '/players' },
    { text: 'Transfers', icon: <SwapHoriz />, path: '/transfers' },
    { text: 'Offers', icon: <LocalOffer />, path: '/offers' },
    { text: 'Reports', icon: <BarChart />, path: '/reports' },
  ];

  return (
    <Drawer variant="permanent" sx={{ width: 240, [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' } }}>
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
