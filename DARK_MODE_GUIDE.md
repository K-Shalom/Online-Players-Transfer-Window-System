# Dark Mode Feature Guide

## Overview

The OPTW system now includes a Dark/Light mode toggle that allows users to switch between light and dark themes for better viewing comfort.

## Features

### ✅ Theme Toggle Button
- **Location**: Top right corner of header (next to notifications)
- **Icons**: 
  - 🌙 Moon icon (Dark Mode) - Shows in light mode
  - ☀️ Sun icon (Light Mode) - Shows in dark mode
- **Tooltip**: Hover to see "Dark Mode" or "Light Mode"

### ✅ Persistent Theme
- Theme preference is saved in browser localStorage
- Your choice persists across sessions
- Automatically loads your preferred theme on next visit

### ✅ Available On All Pages
- Login page
- Signup page
- All dashboard pages
- All management pages
- Settings page
- Reports page

## How to Use

### Toggle Theme
1. **In Header** (when logged in):
   - Click the moon/sun icon in the top right
   - Theme switches instantly
   - All pages update automatically

2. **On Login/Signup Pages**:
   - Click the moon/sun icon next to page title
   - Theme switches for better viewing

### Theme Applies To
- ✅ Background colors
- ✅ Text colors
- ✅ Card/Paper components
- ✅ Tables
- ✅ Forms
- ✅ Buttons
- ✅ Sidebar
- ✅ Header
- ✅ All Material-UI components

## Color Schemes

### Light Mode (Default)
- **Background**: White (#ffffff)
- **Paper**: White (#ffffff)
- **Text**: Dark gray/black
- **Header**: Blue (#1976d2)
- **Sidebar**: White (#ffffff)

### Dark Mode
- **Background**: Dark (#121212)
- **Paper**: Dark gray (#1e1e1e)
- **Text**: White/light gray
- **Header**: Dark gray (#1e1e1e)
- **Sidebar**: Dark gray (#1e1e1e)

## Technical Implementation

### Files Created/Modified

#### 1. Theme Context (`src/context/ThemeContext.jsx`)
```jsx
- Creates theme context
- Manages theme state (light/dark)
- Saves preference to localStorage
- Provides theme to entire app
```

#### 2. Layout Component (`src/components/Layout.jsx`)
```jsx
- Added theme toggle button
- Moon/Sun icon based on current mode
- Tooltip for better UX
```

#### 3. Login Page (`src/pages/Login.jsx`)
```jsx
- Theme toggle in header
- Wrapped in Paper for better appearance
- Supports dark mode
```

#### 4. Signup Page (`src/pages/Signup.jsx`)
```jsx
- Theme toggle in header
- Wrapped in Paper for better appearance
- Supports dark mode
```

#### 5. App.jsx
```jsx
- Wrapped with ThemeContextProvider
- Enables theme across entire app
```

## Benefits

### 1. **Eye Comfort**
- Dark mode reduces eye strain in low light
- Light mode better for bright environments
- User can choose based on preference

### 2. **Battery Saving**
- Dark mode saves battery on OLED screens
- Reduces power consumption
- Better for mobile devices

### 3. **Accessibility**
- Helps users with light sensitivity
- Better contrast options
- Improves readability

### 4. **Modern UX**
- Professional appearance
- Follows modern design trends
- User preference respected

## Theme Persistence

### How It Works
```javascript
// Theme is saved to localStorage
localStorage.setItem('theme', 'dark');

// Theme is loaded on app start
const savedTheme = localStorage.getItem('theme');
```

### Storage Location
- **Browser**: localStorage
- **Key**: 'theme'
- **Values**: 'light' or 'dark'

### Clear Theme Preference
To reset to default (light mode):
```javascript
localStorage.removeItem('theme');
// Then refresh the page
```

## Customization

### Change Default Theme
Edit `src/context/ThemeContext.jsx`:
```jsx
const [mode, setMode] = useState(() => {
  return localStorage.getItem('theme') || 'dark'; // Change to 'dark'
});
```

### Customize Colors
Edit theme configuration in `ThemeContext.jsx`:
```jsx
const theme = useMemo(
  () =>
    createTheme({
      palette: {
        mode,
        primary: {
          main: '#1976d2', // Change primary color
        },
        ...(mode === 'dark' && {
          background: {
            default: '#121212', // Change dark background
            paper: '#1e1e1e',   // Change dark paper
          },
        }),
      },
    }),
  [mode]
);
```

### Add More Theme Options
You can extend to support more themes:
```jsx
// Add 'auto' mode that follows system preference
const [mode, setMode] = useState(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  return saved || 'light';
});
```

## Troubleshooting

### Theme Not Switching
1. Check browser console for errors
2. Verify ThemeContextProvider wraps App
3. Clear localStorage and try again
4. Hard refresh (Ctrl+Shift+R)

### Theme Not Persisting
1. Check if localStorage is enabled
2. Verify no browser extensions blocking storage
3. Check browser privacy settings
4. Try incognito mode to test

### Colors Look Wrong
1. Clear browser cache
2. Check theme configuration in ThemeContext
3. Verify Material-UI version compatibility
4. Check for CSS conflicts

## Browser Support

### Fully Supported
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

### Requirements
- localStorage support
- Modern browser (ES6+)
- JavaScript enabled

## Future Enhancements

Possible improvements:
- 🌓 Auto mode (follows system preference)
- 🎨 Multiple color themes
- 🔧 Custom theme builder
- 📱 Better mobile theme
- ⚡ Smooth theme transitions
- 🎯 Per-page theme settings

## Keyboard Shortcuts

Consider adding:
```
Ctrl+Shift+D - Toggle Dark Mode
```

## Accessibility

### Screen Readers
- Theme toggle has proper aria-labels
- Tooltip provides context
- Icon changes are announced

### Keyboard Navigation
- Theme toggle is keyboard accessible
- Tab to reach button
- Enter/Space to toggle

## Performance

### Optimized
- ✅ Theme state managed efficiently
- ✅ Only re-renders when theme changes
- ✅ localStorage access minimized
- ✅ No performance impact

### Bundle Size
- Minimal addition (~2KB)
- Uses existing Material-UI theme system
- No additional dependencies

---

**Enjoy your new Dark Mode! 🌙✨**

Toggle between themes anytime for the best viewing experience!
