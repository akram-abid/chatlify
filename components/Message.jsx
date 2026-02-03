import React from "react";
import { MessageItem } from "./MessageItem";

export const Message = ({ thread, messages }) => {
  return (
    <div className="flex flex-col h-full bg-blue-900 text-white">
      
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="opacity-60">#</span>
          <span className="font-semibold">
            {thread?.title || "conversation"}
          </span>
        </div>

        <div className="opacity-60 text-sm">ⓘ ⚙️</div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))} */}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 bg-blue-800 rounded-lg px-3 py-2">
          <span className="opacity-50">+</span>
          <input
            type="text"
            placeholder={`Message #${thread?.title || "channel"}`}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

    </div>
  );
};

export default Message;
