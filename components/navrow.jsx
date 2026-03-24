import { faAdd, faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import ThemeSwitcherButton from './ThemeSwitcher';
import LogoutButton from './ui/LogoutButton';

const Navrow = ({
  workspaces = [],
  updateSections,
  onSelectWorkspace,
  selectedWorkspaceId,
}) => {
  const handleClick = (ws) => {
    updateSections(ws.sections);
    onSelectWorkspace(ws);
  };

  return (
    <nav className="navrow">
      {/* Logo */}
      <div className="navrow__logo">
        <div className="navrow__logo-ring">
          <Image
            src="/logo.png"
            alt="logo"
            width={28}
            height={28}
            className="navrow__logo-img"
          />
        </div>
      </div>

      {/* Profile */}
      <div className="navrow__profile">
        <div className="navrow__avatar-wrap">
          <Image
            src="/profilepic.jpeg"
            alt="profile"
            width={40}
            height={40}
            className="navrow__avatar"
          />
          <span className="navrow__status-dot" />
        </div>
      </div>

      <div className="navrow__divider" />

      {/* Workspaces */}
      <div className="navrow__workspaces">
        {workspaces.map((ws, i) => {
          const isActive = ws.id === selectedWorkspaceId;
          const colors = [
            'ws-color-blue',
            'ws-color-purple',
            'ws-color-teal',
            'ws-color-amber',
            'ws-color-rose',
          ];
          const colorClass = colors[i % colors.length];

          return (
            <button
              key={ws.id}
              onClick={() => handleClick(ws)}
              className={`navrow__ws-btn ${colorClass} ${isActive ? 'is-active' : ''}`}
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
