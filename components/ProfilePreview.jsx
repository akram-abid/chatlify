import React, { useState } from 'react';
import { faCircle, faEnvelope, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const GRADIENTS = [
  'linear-gradient(135deg, #11a2d6, #0b6fa0)',
  'linear-gradient(135deg, #7c3aed, #5b21b6)',
  'linear-gradient(135deg, #0d9488, #0f766e)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #e11d48, #be123c)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #2563eb, #1d4ed8)',
];
const getGradient = (name = '') => GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

/* Status config */
const STATUS_CONFIG = {
  online:  { label: 'Online',     color: '#22c55e', glow: 'rgba(34,197,94,0.5)'   },
  away:    { label: 'Away',       color: '#facc15', glow: 'rgba(250,204,21,0.5)'  },
  busy:    { label: 'Busy',       color: '#ef4444', glow: 'rgba(239,68,68,0.5)'   },
  offline: { label: 'Offline',    color: 'rgba(255,255,255,0.2)', glow: 'transparent' },
};

/* Single profile card */
const ProfileCard = ({ user, index }) => {
  const [hovered, setHovered] = useState(false);
  const status  = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.offline;
  const gradient = getGradient(user.name);
  const initial  = user.name?.[0]?.toUpperCase() ?? '?';

  return (
    <div
      className={`profile-card ${hovered ? 'profile-card--hovered' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow layer */}
      <div className="profile-card__glow" style={{ background: gradient, opacity: hovered ? 0.06 : 0 }} />

      {/* Avatar */}
      <div className="profile-card__avatar-wrap">
        {user.image ? (
          <img src={user.image} alt={user.name} className="profile-card__avatar-img" />
        ) : (
          <div className="profile-card__avatar" style={{ background: gradient }}>
            {initial}
          </div>
        )}
        <span
          className="profile-card__status-dot"
          style={{ background: status.color, boxShadow: `0 0 6px ${status.glow}` }}
        />
      </div>

      {/* Info */}
      <div className="profile-card__info">
        <p className="profile-card__name">{user.name}</p>
        <p className="profile-card__sub">{user.sub}</p>
      </div>

      {/* Badge / status */}
      <div className={`profile-card__badge profile-card__badge--${user.status}`}>
        {status.label}
      </div>

      {/* Actions — reveal on hover */}
      <div className={`profile-card__actions ${hovered ? 'is-visible' : ''}`}>
        <button className="profile-card__action-btn" title="Message">
          <FontAwesomeIcon icon={faEnvelope} />
        </button>
        <button className="profile-card__action-btn" title="More">
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </button>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   PROFILE PREVIEW PANEL
────────────────────────────────────────────── */
const DEMO_USERS = [
  { name: 'Mustapha Netfaoui', sub: 'awedi rani mechgoul',   status: 'online'  },
  { name: 'Amina Khaldi',      sub: 'Product Designer',       status: 'away'    },
  { name: 'Ryad Benmansour',   sub: 'Backend Engineer',       status: 'busy'    },
  { name: 'Sara Tlemceni',     sub: 'QA Lead',                status: 'online'  },
  { name: 'Bilal Ounis',       sub: 'DevOps',                 status: 'offline' },
  { name: 'Djamila Ferhat',    sub: 'UX Researcher',          status: 'online'  },
  { name: 'Karima Meziani',    sub: 'Frontend Developer',     status: 'away'    },
];

const ProfilePreview = ({ users = DEMO_USERS }) => {
  const onlineCount = users.filter((u) => u.status === 'online').length;

  return (
    <div className="profile-preview">
      {/* Header */}
      <div className="profile-preview__header">
        <div className="profile-preview__header-left">
          <span className="profile-preview__title">Members</span>
          <span className="profile-preview__total">{users.length}</span>
        </div>
        <div className="profile-preview__online-pill">
          <span className="profile-preview__online-dot" />
          <span>{onlineCount} online</span>
        </div>
      </div>

      {/* List */}
      <div className="profile-preview__list scrollbar-thin">
        {users.map((user, i) => (
          <ProfileCard key={i} user={user} index={i} />
        ))}
      </div>
    </div>
  );
};

export default ProfilePreview;