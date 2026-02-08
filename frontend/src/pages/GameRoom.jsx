import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import ChatLog from '../components/ChatLog';
import ChatInput from '../components/ChatInput';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'system',
      content: '欢迎来到 AI Dungeon Master！请先在设置中配置 AI API。',
      timestamp: new Date().toISOString()
    }
  ]);
  const [connected, setConnected] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
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

  const handleSendMessage = async (content) => {
    if (!content.trim()) return;

    // 添加玩家消息到聊天
    const playerMessage = {
      id: Date.now().toString(),
      senderName: playerName,
      content,
      type: 'speech',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, playerMessage]);

    // 通过 Socket.io 发送给其他玩家
    if (connected && socketRef.current) {
      socketRef.current.emit('send_message', {
        roomId,
        playerId: socketRef.current.id,
        playerName,
        content
      });
    }

    // 如果启用了 AI，请求 AI 响应
    if (aiEnabled) {
      setIsLoadingAI(true);
      try {
        const response = await axios.post(`${API_URL}/api/ai/chat`, {
          message: content,
          context: {
            recentMessages: messages.slice(-5),
            characters: {
              [playerName]: { name: playerName, level: 1, class: 'Adventurer', hp: { current: 10, max: 10 } }
            }
          }
        });

        const aiMessage = {
          id: response.id || Date.now().toString(),
          senderName: 'DM',
          content: response.narrative || 'Something happens...',
          type: 'narrative',
          timestamp: new Date().toISOString(),
          ...(response.diceRollRequest && { diceRollRequest: response.diceRollRequest }),
          ...(response.events && response.events.length > 0 && { events: response.events })
        };

        setMessages(prev => [...prev, aiMessage]);

        // 也通过 Socket.io 广播 AI 响应
        if (connected && socketRef.current) {
          socketRef.current.emit('send_message', {
            roomId,
            playerId: 'ai-dm',
            senderName: 'DM',
            content: aiMessage.content
          });
        }
      } catch (error) {
        console.error('AI response error:', error);
        const errorMessage = {
          id: Date.now().toString(),
          type: 'system',
          content: `AI 响应失败: ${error.response?.data?.error || error.message}. 请检查设置中的 API 配置。`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoadingAI(false);
      }
    }
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
            {isLoadingAI && (
              <span className="ml-3 text-dnd-purple">🤖 AI 正在思考...</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-white">AI DM</span>
          </label>
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            离开房间
          </button>
        </div>
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
