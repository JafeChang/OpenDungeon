import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    api_url: 'https://api.openai.com/v1',
    api_key: '',
    model: 'gpt-4',
    temperature: '0.7',
    max_tokens: '2000'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings`);
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fall back to localStorage
        const savedSettings = localStorage.getItem('llm_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Save to backend
      await axios.post(`${API_URL}/api/settings`, settings);

      // Also save to localStorage as backup
      localStorage.setItem('llm_settings', JSON.stringify(settings));

      // Mask the API key in the message
      const maskedKey = settings.api_key
        ? `${settings.api_key.slice(0, 8)}...${settings.api_key.slice(-4)}`
        : '(not set)';

      setMessage({
        type: 'success',
        text: `设置已保存！API Key: ${maskedKey}, Model: ${settings.model}`
      });

      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: '保存设置失败：' + (error.response?.data?.error || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← 返回大厅
          </button>
          <h1 className="text-3xl font-bold text-white">AI 设置</h1>
          <p className="text-gray-400 mt-2">
            配置 LLM 提供商以启用 AI Dungeon Master
          </p>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="space-y-4">
            {/* API URL */}
            <div>
              <label htmlFor="api_url" className="block text-sm font-medium text-gray-300 mb-2">
                API Base URL
              </label>
              <input
                type="url"
                id="api_url"
                name="api_url"
                value={settings.api_url}
                onChange={handleChange}
                placeholder="https://api.openai.com/v1"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                例如: https://api.openai.com/v1 或 http://192.168.1.x:11434/v1 (Ollama)
              </p>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="api_key" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                id="api_key"
                name="api_key"
                value={settings.api_key}
                onChange={handleChange}
                placeholder="sk-..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                留空可使用本地模型（如 Ollama）
              </p>
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                模型名称
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={settings.model}
                onChange={handleChange}
                placeholder="gpt-4"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white placeholder-gray-400"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                例如: gpt-4, gpt-3.5-turbo, deepseek-chat, gemini-pro, llama2
              </p>
            </div>

            {/* Temperature */}
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-300 mb-2">
                Temperature: {settings.temperature}
              </label>
              <input
                type="range"
                id="temperature"
                name="temperature"
                value={settings.temperature}
                onChange={handleChange}
                min="0"
                max="2"
                step="0.1"
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-1">
                较低的值使输出更确定性，较高的值使输出更随机
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label htmlFor="max_tokens" className="block text-sm font-medium text-gray-300 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                id="max_tokens"
                name="max_tokens"
                value={settings.max_tokens}
                onChange={handleChange}
                min="100"
                max="8000"
                step="100"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-dnd-purple focus:border-transparent text-white"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-900/30 text-green-200 border border-green-700'
                  : 'bg-red-900/30 text-red-200 border border-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-dnd-purple hover:bg-dnd-purple-dark disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? '保存中...' : '保存设置'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white mb-3">常见 LLM 提供商配置</h2>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-700 rounded p-3">
              <p className="font-medium text-dnd-purple">OpenAI</p>
              <p className="text-gray-300">URL: https://api.openai.com/v1</p>
              <p className="text-gray-300">Model: gpt-4, gpt-3.5-turbo</p>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <p className="font-medium text-dnd-purple">DeepSeek</p>
              <p className="text-gray-300">URL: https://api.deepseek.com/v1</p>
              <p className="text-gray-300">Model: deepseek-chat</p>
            </div>
            <div className="bg-gray-700 rounded p-3">
              <p className="font-medium text-dnd-purple">Ollama (本地)</p>
              <p className="text-gray-300">URL: http://localhost:11434/v1</p>
              <p className="text-gray-300">Model: llama2, mistral, codellama</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
