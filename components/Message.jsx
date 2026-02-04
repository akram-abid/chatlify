import React, { useState } from 'react';
import { MessageItem } from './MessageItem';

export const Message = ({ thread, messages }) => {
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-col h-full bg-blue-900 text-white">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="opacity-60">#</span>
          <span className="font-semibold">
            {thread?.title || 'conversation'}
          </span>
        </div>

        <div className="opacity-60 text-sm">ⓘ ⚙️</div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages?.length > 0 ? (
          messages.map((msg) => <MessageItem key={msg.id} message={msg} />)
        ) : (
          <div className="text-white/50 text-sm">No messages yet</div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 ">
        <div className="flex items-center gap-2 bg-blue-800 rounded-lg px-3 py-2 justify-between">
          <div className="flex gap-2">
            <span className="opacity-50">+</span>
            <input
              type="text"
              placeholder={`Message #${thread?.title || 'channel'}`}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div
            onClick={() => {
              
            }}
            className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-black font-bold"
          >
            S
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
