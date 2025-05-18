'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemeType>('dark');
  const [mounted, setMounted] = useState(false);

  // Mount check to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if theme is stored in local storage
    try {
      const savedTheme = localStorage.getItem('jogIn-theme') as ThemeType;
      console.log('Retrieved theme from localStorage:', savedTheme);
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to body
    const newClass = theme === 'dark' ? 'dark-theme' : 'light-theme';
    console.log('Applying theme class:', newClass);
    
    // Remove both classes first to ensure clean state
    document.body.classList.remove('dark-theme', 'light-theme');
    // Then add the correct one
    document.body.classList.add(newClass);
    
    // For debugging - log the current body classes
    console.log('Body classes after update:', document.body.className);
    
    // Save theme to local storage
    try {
      localStorage.setItem('jogIn-theme', theme);
      console.log('Saved theme to localStorage:', theme);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    console.log('Toggle theme called. Current theme:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('Switching to theme:', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 