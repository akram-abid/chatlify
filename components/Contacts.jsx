'use client';

import { useState } from 'react';
import SearchInput from './SearchInput';
import { faChevronDown, faChevronRight, faHashtag, faLock, faVolumeHigh } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const sectionIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('voice')) return faVolumeHigh;
  if (lower.includes('private')) return faLock;
  return faHashtag;
};

const Contacts = ({ sections, updateSelectedThred, selectedThread }) => {
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!sections || sections.length === 0) {
    return (
      <aside className="contacts-panel">
        <div className="contacts-empty">
          <div className="contacts-empty__icon">💬</div>
          <p className="contacts-empty__title">No workspace selected</p>
          <p className="contacts-empty__sub">Pick a workspace to get started</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="contacts-panel">
      {/* Header */}
      <div className="contacts-header">
        <div className="contacts-workspace-badge">
          <span className="contacts-workspace-dot" />
          <span className="contacts-workspace-title">
            {sections[0]?.workspaceName || 'Workspace'}
          </span>
        </div>
        <SearchInput />
      </div>

      {/* Sections */}
      <div className="contacts-body scrollbar-hide">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.id];
          const icon = sectionIcon(section.name);

          return (
            <div key={section.id} className="contacts-section">
              {/* Section header */}
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
                  {section.threads?.length || 0}
                </span>
              </button>

              {/* Threads */}
              {!isCollapsed && (
                <div className="contacts-threads">
                  {section.threads?.map((thread) => {
                    const isActive = selectedThread?.id === thread.id;
                    return (
                      <button
                        key={thread.id}
                        onClick={() => {
                          updateSelectedThred(thread);
                        }}
                        className={`contacts-thread-btn ${isActive ? 'is-active' : ''}`}
                      >
                        <FontAwesomeIcon
                          icon={icon}
                          className="contacts-thread-icon"
                        />
                        <span className="contacts-thread-name">{thread.title}</span>
                        {thread.unread > 0 && (
                          <span className="contacts-unread-badge">{thread.unread}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="contacts-footer">
        <div className="contacts-footer__status">
          <span className="contacts-footer__dot" />
          <span className="contacts-footer__text">Connected</span>
        </div>
      </div>
    </aside>
  );
};

export default Contacts;