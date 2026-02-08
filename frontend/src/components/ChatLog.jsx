export default function ChatLog({ messages, onDiceRoll }) {
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

  // Simple dice roll function
  const rollDice = (notation) => {
    const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) return { error: 'Invalid notation' };

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    const rolls = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    return {
      total,
      rolls,
      modifier,
      notation
    };
  };

  const handleDiceRoll = (message) => {
    if (!message.diceRollRequest || !onDiceRoll) return;

    const { type, dc, description } = message.diceRollRequest;

    // Convert special dice types to standard notation
    let notation = '1d20'; // Default to d20
    if (type === 'damage_roll') {
      notation = '1d8'; // Default damage dice
    }

    const result = rollDice(notation);

    // Check for error in roll result
    if (!result || result.error) {
      console.error('Invalid dice notation:', notation);
      return;
    }

    onDiceRoll({
      messageId: message.id,
      check: message.diceRollRequest,
      result
    });
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

          {/* Dice Roll Request */}
          {message.diceRollRequest && (
            <div className="mt-3 p-3 bg-yellow-900/40 border border-yellow-600 rounded-lg">
              <p className="text-yellow-200 text-sm font-semibold mb-1">
                🎲 需要检定: {message.diceRollRequest.description}
              </p>
              <p className="text-yellow-100 text-xs mb-2">
                类型: {message.diceRollRequest.type} | DC: {message.diceRollRequest.dc}
              </p>
              <button
                onClick={() => handleDiceRoll(message)}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold rounded transition-colors"
              >
                投掷 {message.diceRollRequest.type}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
