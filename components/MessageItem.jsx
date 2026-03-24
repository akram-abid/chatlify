const avatarGradients = [
  'linear-gradient(135deg, #11a2d6, #0b6fa0)',
  'linear-gradient(135deg, #7c3aed, #5b21b6)',
  'linear-gradient(135deg, #0d9488, #0f766e)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #e11d48, #be123c)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #2563eb, #1d4ed8)',
];

const getGradient = (name = '') => {
  const idx = name.charCodeAt(0) % avatarGradients.length;
  return avatarGradients[idx];
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageItem = ({ message, isOwn = false, showAvatar = true }) => {
  const gradient = getGradient(message.user?.name || '');
  const initial = message.user?.name?.[0]?.toUpperCase() || '?';

  return (
    <div className={`msg-item ${isOwn ? 'msg-item--own' : ''}`}>
      {/* Avatar */}
      <div className="msg-avatar-col">
        {showAvatar ? (
          <div
            className="msg-avatar"
            style={{ background: gradient }}
            title={message.user?.name}
          >
            {initial}
          </div>
        ) : (
          <div className="msg-avatar-spacer" />
        )}
      </div>

      {/* Body */}
      <div className="msg-body">
        {showAvatar && (
          <div className="msg-header">
            <span className="msg-username">{message.user?.name}</span>
            <span className="msg-time">{formatTime(message.createdAt)}</span>
          </div>
        )}
        <div className="msg-bubble-wrap">
          <p className="msg-text">{message.content}</p>
          {!showAvatar && (
            <span className="msg-time msg-time--inline">{formatTime(message.createdAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
};