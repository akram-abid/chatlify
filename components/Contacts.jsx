'use client';

import { useState, useEffect, useRef } from 'react';
import SearchInput from './SearchInput';
import {
  faChevronDown,
  faChevronRight,
  faHashtag,
  faLock,
  faVolumeHigh,
  faCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/* ── helpers ── */
const sectionIcon = (name = '') => {
  const l = name.toLowerCase();
  if (l.includes('voice')) return faVolumeHigh;
  if (l.includes('private')) return faLock;
  return faHashtag;
};

const avatarGradients = [
  'linear-gradient(135deg,#11a2d6,#0b6fa0)',
  'linear-gradient(135deg,#7c3aed,#5b21b6)',
  'linear-gradient(135deg,#0d9488,#0f766e)',
  'linear-gradient(135deg,#d97706,#b45309)',
  'linear-gradient(135deg,#e11d48,#be123c)',
];
const getGradient = (name = '') =>
  avatarGradients[name.charCodeAt(0) % avatarGradients.length];

/* ── DM conversation item ── */
const DMItem = ({ dm, isActive, onClick, isOnline }) => {
  const grad = getGradient(dm.name || '');
  const initial = (dm.name || '?')[0].toUpperCase();
  return (
    <button
      onClick={onClick}
      className={`dm-item ${isActive ? 'is-active' : ''}`}
    >
      <div className="dm-item__avatar-wrap">
        <div className="dm-item__avatar" style={{ background: grad }}>
          {dm.avatar ? (
            <img
              src={dm.avatar}
              alt={dm.name}
              className="dm-item__avatar-img"
            />
          ) : (
            initial
          )}
        </div>
        <span
          className={`dm-item__status ${isOnline ? 'is-online' : 'is-offline'}`}
        />
      </div>
      <div className="dm-item__body">
        <div className="dm-item__top">
          <span className="dm-item__name">{dm.name}</span>
          {dm.lastTime && <span className="dm-item__time">{dm.lastTime}</span>}
        </div>
        {dm.lastMessage && <p className="dm-item__preview">{dm.lastMessage}</p>}
      </div>
      {dm.unread > 0 && <span className="dm-item__badge">{dm.unread}</span>}
    </button>
  );
};

/* ── main component ── */
const Contacts = ({
  sections = [],
  updateSelectedThred,
  selectedThread,
  isDMMode,
  dmConversations = [],
  onlineUsers = [],
  selectedDM,
  onSelectDM,
}) => {
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');
  const [rendered, setRendered] = useState(isDMMode ? 'dm' : 'ws');
  const [transitioning, setTransitioning] = useState(false);
  const prevMode = useRef(isDMMode);

  /* animate panel flip between modes */
  useEffect(() => {
    if (prevMode.current === isDMMode) return;
    prevMode.current = isDMMode;

    setTransitioning(true);
    const t = setTimeout(() => {
      setRendered(isDMMode ? 'dm' : 'ws');
      setTransitioning(false);
    }, 200); // half of CSS transition
    return () => clearTimeout(t);
  }, [isDMMode]);

  const toggleSection = (id) => setCollapsed((p) => ({ ...p, [id]: !p[id] }));

  /* ── WORKSPACE PANEL ── */
  const WorkspacePanel = () => {
    if (!sections || sections.length === 0) {
      return (
        <div className="contacts-empty">
          <div className="contacts-empty__icon">🏠</div>
          <p className="contacts-empty__title">No workspace selected</p>
          <p className="contacts-empty__sub">Pick one from the sidebar</p>
        </div>
      );
    }
    return (
      <>
        <div className="contacts-header">
          <div className="contacts-workspace-badge">
            <span className="contacts-workspace-dot" />
            <span className="contacts-workspace-title">
              {sections[0]?.workspaceName || 'Workspace'}
            </span>
          </div>
          <SearchInput
            placeholder="Search channels…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="contacts-body scrollbar-hide">
          {sections.map((section) => {
            const isCollapsed = collapsed[section.id];
            const icon = sectionIcon(section.name);
            const threads = section.threads?.filter(
              (t) =>
                !search || t.title?.toLowerCase().includes(search.toLowerCase())
            );
            return (
              <div key={section.id} className="contacts-section">
                <button
                  className="contacts-section-header"
                  onClick={() => toggleSection(section.id)}
                >
                  <FontAwesomeIcon
                    icon={isCollapsed ? faChevronRight : faChevronDown}
                    className="contacts-section-chevron"
                  />
                  <span className="contacts-section-label">{section.name}</span>
                  <span className="contacts-section-count">
                    {threads?.length || 0}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="contacts-threads">
                    {threads?.map((thread) => (
                      <button
                        key={thread.id}
                        onClick={() => updateSelectedThred(thread)}
                        className={`contacts-thread-btn ${selectedThread?.id === thread.id ? 'is-active' : ''}`}
                      >
                        <FontAwesomeIcon
                          icon={icon}
                          className="contacts-thread-icon"
                        />
                        <span className="contacts-thread-name">
                          {thread.title}
                        </span>
                        {thread.unread > 0 && (
                          <span className="contacts-unread-badge">
                            {thread.unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="contacts-footer">
          <div className="contacts-footer__status">
            <span className="contacts-footer__dot" />
            <span className="contacts-footer__text">Connected</span>
          </div>
        </div>
      </>
    );
  };

  /* ── DM PANEL ── */
  const DMPanel = () => {
    const filtered = dmConversations.filter(
      (dm) => !search || dm.name?.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <>
        <div className="contacts-header">
          <div className="contacts-workspace-badge">
            <span className="dm-panel__title-icon">💬</span>
            <span className="contacts-workspace-title">Messages</span>
          </div>
          <SearchInput
            placeholder="Search people…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="contacts-body scrollbar-hide">
          {filtered.length === 0 ? (
            <div className="dm-empty">
              <div className="dm-empty__icon">👋</div>
              <p className="dm-empty__title">No conversations yet</p>
              <p className="dm-empty__sub">Start a new message to connect</p>
              <button className="dm-empty__cta">New Message</button>
            </div>
          ) : (
            <div className="dm-list">
              {filtered.map((dm) => (
                <DMItem
                  key={dm.id}
                  dm={dm}
                  isActive={selectedDM?.id === dm.id}
                  isOnline={onlineUsers.includes(dm.userId)}
                  onClick={() => onSelectDM?.(dm)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="contacts-footer">
          <button className="dm-new-btn">
            <span className="dm-new-btn__icon">✏️</span>
            <span>New Message</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <aside className="contacts-panel">
      <div
        className={`contacts-slide ${transitioning ? 'contacts-slide--exit' : 'contacts-slide--enter'}`}
      >
        {rendered === 'ws' ? <WorkspacePanel /> : <DMPanel />}
      </div>
    </aside>
  );
};

export default Contacts;
