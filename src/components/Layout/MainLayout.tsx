'use client';

import Navbar from '../Navigation/Navbar';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  
  // Additional effect to ensure theme classes are applied
  useEffect(() => {
    const themeClass = theme === 'dark' ? 'dark-theme' : 'light-theme';
    
    // Remove both theme classes first
    document.body.classList.remove('dark-theme', 'light-theme');
    // Add the current theme class
    document.body.classList.add(themeClass);
    
    console.log('MainLayout applied theme:', themeClass);
  }, [theme]);
  
  return (
    <div className={`min-h-screen text-primary relative overflow-hidden ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      {/* Background image and gradient layers */}
      <div className="fixed inset-0 z-0">
        {/* Gradient overlay */}
        <div className={`absolute inset-0 ${theme === 'dark' 
          ? 'bg-gradient-to-b from-premium-black via-premium-darkgray to-premium-gray opacity-90' 
          : 'bg-gradient-to-b from-white/90 to-white/70'} z-10`}></div>
        
        {/* Background image with blur */}
        <div className="absolute inset-0 bg-center bg-cover filter blur-sm transition-all duration-500"
             style={{ backgroundImage: 'url("/images/runner1.jpg")', opacity: '0.15' }}>
        </div>
        
        {/* Animated gradient accent */}
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${theme === 'dark' ? 'bg-premium-accent' : 'bg-premium-accentDark'} rounded-full filter blur-[100px] opacity-10 animate-pulse-slow`}></div>
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${theme === 'dark' ? 'bg-premium-accent' : 'bg-premium-accentDark'} rounded-full filter blur-[100px] opacity-10 animate-pulse-slow`} 
             style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
} 