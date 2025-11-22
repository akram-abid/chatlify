"use client"
import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitcherButton() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has a preference
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="relative w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-center  transition-colors duration-500">
      <div className="text-center space-y-8">        
        <button
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-full bg-amber-400 dark:bg-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center group overflow-hidden"
          aria-label="Toggle theme"
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 dark:from-blue-400 dark:to-indigo-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
          
          {/* Icons with rotation animation */}
          <div className="relative">
            <Sun 
              className={`absolute inset-0 w-5 h-5 text-white transition-all duration-500 ${
                isDark 
                  ? 'rotate-90 scale-0 opacity-0' 
                  : 'rotate-0 scale-100 opacity-100'
              }`}
              strokeWidth={2.5}
            />
            <Moon 
              className={`w-5 h-5 text-white transition-all duration-500 ${
                isDark 
                  ? 'rotate-0 scale-100 opacity-100' 
                  : '-rotate-90 scale-0 opacity-0'
              }`}
              strokeWidth={2.5}
            />
          </div>

          {/* Ripple effect on click */}
          <span className="absolute inset-0 rounded-full bg-white opacity-0 group-active:opacity-30 transition-opacity duration-150" />
        </button>
      </div>
    </div>
  );
}