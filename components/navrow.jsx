'use client';

import { faAdd, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useState, useRef } from 'react';
import ThemeSwitcherButton from './ThemeSwitcher';
import LogoutButton from './ui/LogoutButton';

const WS_COLORS = [
  'ws-color-blue',
  'ws-color-purple',
  'ws-color-teal',
  'ws-color-amber',
  'ws-color-rose',
];

// People / DM icon as inline SVG
const PeopleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const Navrow = ({ workspaces = [], updateSections, onSelectWorkspace, selectedWorkspaceId, onToggleDM, isDMMode }) => {  const [prevWsId, setPrevWsId] = useState(null);
  const [animDir, setAnimDir] = useState(null); // 'down' | 'up'
  const animTimeout = useRef(null);

  const handleWsClick = (ws, idx) => {
    if (isDMMode) {
      // switching from DM → workspace: slide in from left
      onToggleDM(false);
    }
    if (ws.id === selectedWorkspaceId) return;

    // figure out direction
    const currentIdx = workspaces.findIndex((w) => w.id === selectedWorkspaceId);
    const dir = idx > currentIdx ? 'down' : 'up';
    setAnimDir(dir);
    setPrevWsId(selectedWorkspaceId);

    clearTimeout(animTimeout.current);
    animTimeout.current = setTimeout(() => {
      setAnimDir(null);
      setPrevWsId(null);
    }, 320);

    updateSections(ws.sections);
    onSelectWorkspace(ws);
  };

  const handleDMToggle = () => {
    onToggleDM(!isDMMode);
  };

  return (
    <nav className="navrow">
      {/* Animated mode indicator line */}
      <div className={`navrow__mode-line ${isDMMode ? 'navrow__mode-line--dm' : 'navrow__mode-line--ws'}`} />

      {/* Logo */}
      <div className="navrow__logo">
        <div className="navrow__logo-ring">
          <Image src="/logo.png" alt="logo" width={28} height={28} className="navrow__logo-img" />
        </div>
      </div>

      {/* Profile */}
      <div className="navrow__profile">
        <div className="navrow__avatar-wrap">
          <Image src="/profilepic.jpeg" alt="profile" width={40} height={40} className="navrow__avatar" />
          <span className="navrow__status-dot" />
        </div>
      </div>

      <div className="navrow__divider" />

      {/* DM / People toggle button */}
      <button
        onClick={handleDMToggle}
        className={`navrow__dm-btn ${isDMMode ? 'is-active' : ''}`}
        title="Direct Messages"
      >
        {isDMMode && <span className="navrow__ws-active-bar" />}
        <span className="navrow__dm-btn-inner">
          <PeopleIcon size={15} />
        </span>
        {/* unread DM dot — wire up real count later */}
        <span className="navrow__dm-dot" />
      </button>

      <div className="navrow__divider navrow__divider--short" />

      {/* Workspaces list */}
      <div className="navrow__workspaces">
        {workspaces.map((ws, i) => {
          const isActive = ws.id === selectedWorkspaceId && !isDMMode;
          const colorClass = WS_COLORS[i % WS_COLORS.length];

          return (
            <button
              key={ws.id}
              onClick={() => handleWsClick(ws, i)}
              className={`navrow__ws-btn ${colorClass} ${isActive ? 'is-active' : ''} ${animDir && prevWsId === ws.id ? `navrow__ws-btn--exit-${animDir}` : ''} ${animDir && ws.id === selectedWorkspaceId ? `navrow__ws-btn--enter-${animDir}` : ''}`}
              title={ws.name || `Workspace ${i + 1}`}
            >
              {isActive && <span className="navrow__ws-active-bar" />}
              <span className="navrow__ws-initial">
                {ws.name ? ws.name[0].toUpperCase() : '?'}
              </span>
            </button>
          );
        })}

        {/* Add workspace */}
        <button className="navrow__add-btn" title="Add workspace">
          <FontAwesomeIcon icon={faAdd} className="navrow__add-icon" />
        </button>
      </div>

      <div className="navrow__spacer" />
      <div className="navrow__divider" />

      {/* Bottom actions */}
      <div className="navrow__actions">
        <button className="navrow__action-btn" title="Settings">
          <FontAwesomeIcon icon={faGear} className="navrow__action-icon" />
        </button>
        <ThemeSwitcherButton />
        <LogoutButton />
      </div>
    </nav>
  );
};

export default Navrow;