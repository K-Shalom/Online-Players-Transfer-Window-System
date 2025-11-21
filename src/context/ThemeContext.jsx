import React, { createContext, useState, useMemo, useEffect, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './AuthContext';

export const ThemeContext = createContext();

// Role-based color schemes
const roleThemes = {
  admin: {
    primary: '#1976d2', // Blue
    secondary: '#dc004e', // Pink
    dark: {
      background: '#121212',
      paper: '#1e1e1e',
      text: '#e0e0e0',
    }
  },
  club: {
    primary: '#2e7d32', // Green
    secondary: '#ff8f00', // Amber
    dark: {
      background: '#121212',
      paper: '#1e1e1e',
      text: '#e0e0e0',
    }
  },
  scout: {
    primary: '#6a1b9a', // Purple
    secondary: '#00b0ff', // Light Blue
    dark: {
      background: '#121212',
      paper: '#1e1e1e',
      text: '#e0e0e0',
    }
  }
};

export const ThemeContextProvider = ({ children }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Get user role or default to 'club' for backward compatibility
  const userRole = user?.role || 'club';
  const roleTheme = roleThemes[userRole] || roleThemes.club;

  useEffect(() => {
    localStorage.setItem('theme', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: roleTheme.primary,
          },
          secondary: {
            main: roleTheme.secondary,
          },
          divider: mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
          ...(mode === 'dark' && {
            background: {
              default: roleTheme.dark.background,
              paper: roleTheme.dark.paper,
            },
            text: {
              primary: roleTheme.dark.text,
            }
          }),
          // Role-based status colors
          status: {
            admin: mode === 'dark' ? '#90caf9' : '#1976d2',
            club: mode === 'dark' ? '#a5d6a7' : '#2e7d32',
            scout: mode === 'dark' ? '#ce93d8' : '#6a1b9a',
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#1f1f1f' : roleTheme.primary,
                backgroundImage: 'none',
                color: mode === 'dark' ? '#e0e0e0' : '#fff',
                borderBottom: mode === 'dark' ? '1px solid #2a2a2a' : 'none',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                backgroundColor: mode === 'dark' ? '#161616' : '#fff',
                backgroundImage: 'none',
                borderRight: mode === 'dark' ? '1px solid #2a2a2a' : 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#1e1e1e' : '#fff',
                border: mode === 'dark' ? '1px solid #2a2a2a' : '1px solid #e0e0e0',
                borderRadius: 12,
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: mode === 'dark' ? '1px solid #2a2a2a' : '1px solid rgba(224, 224, 224, 1)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 10,
              },
            },
          },
        },
      }),
    [mode, userRole]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
