"use client";
import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitcherButton() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return <div className="theme-btn-placeholder" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className={`theme-btn ${isDark ? 'theme-btn--dark' : 'theme-btn--light'}`}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-btn__track" />
      <span className={`theme-btn__icon ${isDark ? 'is-dark' : 'is-light'}`}>
        {isDark ? (
          <Moon size={14} strokeWidth={2.5} />
        ) : (
          <Sun size={14} strokeWidth={2.5} />
        )}
      </span>
    </button>
  );
}