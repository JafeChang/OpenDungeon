export default function ChatLog({ messages }) {
  const getMessageStyle = (type) => {
    switch (type) {
      case 'narrative':
        return 'border-l-4 border-purple-500 bg-purple-900/20';
      case 'speech':
        return 'border-l-4 border-blue-500 bg-blue-900/20';
      case 'roll':
        return 'bg-yellow-900/30 text-yellow-200';
      case 'system':
        return 'text-center text-gray-400 text-sm italic';
      default:
        return 'bg-gray-800';
    }
  };

  const getSenderName = (message) => {
    if (message.type === 'system') return '';
    if (message.type === 'narrative') return 'DM';
    return message.senderName || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`p-4 rounded-lg ${getMessageStyle(message.type)} animate-fade-in`}
        >
          {message.type !== 'system' && (
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-sm">
                {getSenderName(message)}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          <p className="text-gray-100 whitespace-pre-wrap">{message.content}</p>
        </div>
      ))}
    </div>
  );
}
