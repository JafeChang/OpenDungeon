import { useState } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export default function DiceRoller({ roomId, playerId, playerName, disabled = false }) {
  const [customNotation, setCustomNotation] = useState('');
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);

  const socket = io(WS_URL);

  const handleQuickRoll = (notation) => {
    performRoll(notation);
  };

  const handleCustomRoll = (e) => {
    e.preventDefault();
    if (!customNotation.trim()) return;
    performRoll(customNotation);
    setCustomNotation('');
  };

  const performRoll = (notation) => {
    setRolling(true);

    // Simulate dice rolling animation
    setTimeout(() => {
      // For now, generate a simple roll on the client
      // In production, this should go through the server for validation
      const result = simpleDiceRoll(notation);

      const rollData = {
        notation,
        result,
        timestamp: new Date().toISOString()
      };

      // Send to server
      socket.emit('roll_dice', {
        roomId,
        playerId,
        playerName,
        roll: rollData
      });

      setLastRoll(rollData);
      setRolling(false);
    }, 500);
  };

  // Simple client-side dice roll (for MVP)
  const simpleDiceRoll = (notation) => {
    const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      return { error: 'Invalid notation' };
    }

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

  const formatRollResult = (result) => {
    if (!result) return '';

    let output = `${result.notation}: `;
    output += `[${result.rolls.join(', ')}]`;

    if (result.modifier !== 0) {
      output += result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`;
    }

    output += ` = **${result.total}**`;

    return output;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">骰子投掷器</h3>

      {/* Quick Roll Buttons */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <button
          onClick={() => handleQuickRoll('1d20')}
          disabled={disabled || rolling}
          className="py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          d20
        </button>
        <button
          onClick={() => handleQuickRoll('1d12')}
          disabled={disabled || rolling}
          className="py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          d12
        </button>
        <button
          onClick={() => handleQuickRoll('1d8')}
          disabled={disabled || rolling}
          className="py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          d8
        </button>
        <button
          onClick={() => handleQuickRoll('1d6')}
          disabled={disabled || rolling}
          className="py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          d6
        </button>
        <button
          onClick={() => handleQuickRoll('1d4')}
          disabled={disabled || rolling}
          className="py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          d4
        </button>
      </div>

      {/* Advantage/Disadvantage */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleQuickRoll('2d20h')}
          disabled={disabled || rolling}
          className="py-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          优势 (2d20 高)
        </button>
        <button
          onClick={() => handleQuickRoll('2d20l')}
          disabled={disabled || rolling}
          className="py-2 bg-red-700 hover:bg-red-800 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          劣势 (2d20 低)
        </button>
      </div>

      {/* Custom Roll Input */}
      <form onSubmit={handleCustomRoll} className="flex gap-2">
        <input
          type="text"
          value={customNotation}
          onChange={(e) => setCustomNotation(e.target.value)}
          placeholder="XdY+Z (例如: 2d6+3)"
          disabled={disabled || rolling}
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!customNotation.trim() || disabled || rolling}
          className="px-4 py-2 bg-dnd-purple hover:bg-dnd-purple-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          投掷
        </button>
      </form>

      {/* Last Roll Result */}
      {lastRoll && (
        <div className={`mt-4 p-3 rounded-lg bg-yellow-900/30 text-yellow-200 ${rolling ? 'animate-dice-roll' : ''}`}>
          <p className="text-sm font-semibold mb-1">
            {playerName} 投掷了:
          </p>
          <p className="font-mono text-lg">{formatRollResult(lastRoll.result)}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-gray-400">
        <p>格式说明：XdY+Z</p>
        <p>• X = 骰子数量</p>
        <p>• Y = 骰子面数</p>
        <p>• Z = 修正值（可选）</p>
        <p>例如：2d6+3 = 投2个6面骰，结果加3</p>
      </div>
    </div>
  );
}
