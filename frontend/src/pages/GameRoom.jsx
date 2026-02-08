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

  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [roomName] = useState(localStorage.getItem('roomName') || '游戏房间');
  const [playerName] = useState(localStorage.getItem('playerName') || '玩家');
  const [roomLanguage, setRoomLanguage] = useState(localStorage.getItem('roomLanguage') || 'zh');

  // Initialize Socket.io connection
  useEffect(() => {
    // Fetch room info and message history
    const fetchRoomInfo = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch room details
        const roomResponse = await axios.get(`${API_URL}/api/rooms/${roomId}`, { headers });
        if (roomResponse.data.room) {
          setRoomLanguage(roomResponse.data.room.language || 'zh');
          localStorage.setItem('roomLanguage', roomResponse.data.room.language || 'zh');
        }

        // Fetch message history
        const messagesResponse = await axios.get(`${API_URL}/api/rooms/${roomId}/messages`, { headers });
        if (messagesResponse.data.messages && messagesResponse.data.messages.length > 0) {
          const historyMessages = messagesResponse.data.messages.map(msg => ({
            id: msg.id,
            senderName: msg.senderId || 'Unknown',
            content: msg.content,
            type: msg.type,
            timestamp: msg.timestamp
          }));
          setMessages(historyMessages);
        } else {
          // Show welcome message for new rooms
          setMessages([{
            id: 'welcome',
            type: 'system',
            content: '欢迎来到 AI Dungeon Master！AI 已自动启用，开始你的冒险吧！',
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Failed to fetch room info:', error);
      }
    };
    fetchRoomInfo();

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

    // Listen for new messages from other players (not from self)
    socket.on('new_message', (message) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Listen for DM responses from other players
    socket.on('dm_response', (data) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        if (prev.some(m => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
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

  const handleDiceRoll = async (rollData) => {
    const { messageId, check, result } = rollData;

    // Add roll result message
    const rollMessage = {
      id: `roll_${Date.now()}`,
      senderName: playerName,
      content: `🎲 检定: ${check.description}\n投掷: ${result.notation} = [${result.rolls.join(', ')}]${result.modifier !== 0 ? (result.modifier > 0 ? '+' : '') + result.modifier : ''} = **${result.total}**\nDC: ${check.dc} | ${result.total >= check.dc ? '✅ 成功' : '❌ 失败'}`,
      type: 'roll',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, rollMessage]);

    // Send roll to AI for response
    setIsLoadingAI(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        message: `(Dice Roll Result: ${result.total} vs DC ${check.dc}, ${result.total >= check.dc ? 'Success' : 'Failure'}) I rolled for ${check.description}.`,
        context: {
          recentMessages: [...messages.slice(-5), rollMessage],
          characters: {
            [playerName]: { name: playerName, level: 1, class: 'Adventurer', hp: { current: 10, max: 10 } }
          },
          language: roomLanguage
        }
      });

      const aiMessage = {
        id: response.data?.id || Date.now().toString(),
        senderName: 'DM',
        content: response.data?.narrative || 'Something happens...',
        type: 'narrative',
        timestamp: new Date().toISOString(),
        ...(response.data?.diceRollRequest && { diceRollRequest: response.data.diceRollRequest }),
        ...(response.data?.events && response.data.events.length > 0 && { events: response.data.events })
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      try {
        await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
          id: aiMessage.id,
          content: aiMessage.content,
          type: 'narrative'
        }, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
      } catch (saveError) {
        console.error('Failed to save AI message:', saveError);
      }

      // Broadcast AI response to other players
      if (connected && socketRef.current) {
        socketRef.current.emit('dm_response', {
          roomId,
          message: aiMessage
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
  };

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

    // 请求 AI 响应
    setIsLoadingAI(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        message: content,
        context: {
          recentMessages: messages.slice(-5),
          characters: {
            [playerName]: { name: playerName, level: 1, class: 'Adventurer', hp: { current: 10, max: 10 } }
          },
          language: roomLanguage
        }
      });

      const aiMessage = {
        id: response.data?.id || Date.now().toString(),
        senderName: 'DM',
        content: response.data?.narrative || 'Something happens...',
        type: 'narrative',
        timestamp: new Date().toISOString(),
        ...(response.data?.diceRollRequest && { diceRollRequest: response.data.diceRollRequest }),
        ...(response.data?.events && response.data.events.length > 0 && { events: response.data.events })
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI response to database
      try {
        await axios.post(`${API_URL}/api/rooms/${roomId}/messages`, {
          id: aiMessage.id,
          content: aiMessage.content,
          type: 'narrative'
        }, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
      } catch (saveError) {
        console.error('Failed to save AI message:', saveError);
      }

      // 通过 Socket.io 广播 AI 响应给其他玩家
      if (connected && socketRef.current) {
        socketRef.current.emit('dm_response', {
          roomId,
          message: aiMessage
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
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          离开房间
        </button>
      </header>

      {/* Chat Log */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-4">
        <ChatLog messages={messages} onDiceRoll={handleDiceRoll} />
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
