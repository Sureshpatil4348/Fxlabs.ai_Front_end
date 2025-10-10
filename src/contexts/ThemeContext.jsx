import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [_isDarkMode, _setIsDarkMode] = useState(false); // Always light mode

  useEffect(() => {
    // Always ensure light mode - remove any dark class
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    // Disabled - only light mode allowed
    console.log('Theme toggle disabled - only light mode is allowed');
  };

  const value = {
    isDarkMode: false, // Always false for light mode
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
