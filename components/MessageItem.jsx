export const MessageItem = ({ message }) => {
  return (
    <div className="flex gap-3">
      
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold">
        {message.user.name[0].toUpperCase()} 
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            { message.user.name }
          </span>
          <span className="text-xs opacity-50">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>

        <div className="text-sm opacity-90">
          {message.content}
        </div>
      </div>

    </div>
  );
};
    