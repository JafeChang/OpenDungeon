import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import ChatLog from '../components/ChatLog';
import ChatInput from '../components/ChatInput';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'system',
      content: '欢迎来到 AI Dungeon Master！设置将在后续版本中实现。',
      timestamp: new Date().toISOString()
    }
  ]);
  const [connected, setConnected] = useState(false);
  const [roomName] = useState(localStorage.getItem('roomName') || '游戏房间');
  const [playerName] = useState(localStorage.getItem('playerName') || '玩家');

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = io(WS_URL);

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);

      // Join the room
      socket.emit('join_room', {
        roomId,
        playerName
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for player joined/left
    socket.on('player_joined', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `${data.playerName} 加入了游戏`,
        timestamp: data.timestamp
      }]);
    });

    socket.on('player_left', (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: '有玩家离开了游戏',
        timestamp: data.timestamp
      }]);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('leave_room');
      socket.disconnect();
    };
  }, [roomId, playerName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content) => {
    if (!connected || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      roomId,
      playerId: socketRef.current.id,
      playerName,
      content
    });
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room');
    }
    localStorage.removeItem('roomName');
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{roomName}</h1>
          <p className="text-sm text-gray-400">
            {connected ? (
              <span className="text-green-400">● 已连接</span>
            ) : (
              <span className="text-red-400">● 未连接</span>
            )}
          </p>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          离开房间
        </button>
      </header>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-4">
        <ChatLog messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!connected}
      />
    </div>
  );
}
