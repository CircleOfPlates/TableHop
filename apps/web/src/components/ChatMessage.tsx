import React from 'react';

interface ChatMessageProps {
  message: {
    id: number;
    message: string;
    createdAt: string;
    user: {
      id: number;
      name: string;
    };
  };
  isOwnMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1 ml-2">
            {message.user.name}
          </div>
        )}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-red-500 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message.message}</p>
        </div>
        <div className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right mr-2' : 'ml-2'}`}>
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

