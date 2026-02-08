import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ModManager() {
  const navigate = useNavigate();
  const [mods, setMods] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mods');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modsRes, statusRes] = await Promise.all([
        axios.get(`${API_URL}/api/mods`),
        axios.get(`${API_URL}/api/system/status`)
      ]);
      setMods(modsRes.data);
      setSystemStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMod = async (modId, enabled) => {
    try {
      if (enabled) {
        await axios.post(`${API_URL}/api/mods/${modId}/disable`);
      } else {
        await axios.post(`${API_URL}/api/mods/${modId}/enable`);
      }
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle mod:', error);
      alert(`操作失败: ${error.message}`);
    }
  };

  const handleReloadMod = async (modId) => {
    try {
      await axios.post(`${API_URL}/api/mods/${modId}/reload`);
      await fetchData();
      alert('模组已重新加载');
    } catch (error) {
      console.error('Failed to reload mod:', error);
      alert(`重载失败: ${error.message}`);
    }
  };

  const getModTypeColor = (type) => {
    const colors = {
      datapack: 'bg-blue-600',
      i18n: 'bg-green-600',
      ruleset: 'bg-purple-600',
      custom: 'bg-yellow-600'
    };
    return colors[type] || 'bg-gray-600';
  };

  const getModTypeLabel = (type) => {
    const labels = {
      datapack: '数据包',
      i18n: '语言包',
      ruleset: '规则集',
      custom: '自定义'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-2"
          >
            ← 返回大厅
          </button>
          <h1 className="text-3xl font-bold">模组管理器</h1>
          <p className="text-gray-400 mt-1">管理游戏模组、语言包和规则集</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('mods')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'mods'
                ? 'text-dnd-purple border-b-2 border-dnd-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            模组 ({mods.length})
          </button>
          <button
            onClick={() => setActiveTab('i18n')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'i18n'
                ? 'text-dnd-purple border-b-2 border-dnd-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            语言
          </button>
          <button
            onClick={() => setActiveTab('rulesets')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'rulesets'
                ? 'text-dnd-purple border-b-2 border-dnd-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            规则集
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'data'
                ? 'text-dnd-purple border-b-2 border-dnd-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            数据
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === 'mods' && (
          <div className="space-y-4">
            {/* System Status */}
            {systemStatus && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold mb-3">系统状态</h2>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">模组总数:</span>
                    <span className="ml-2 font-semibold">{systemStatus.mods.total}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">已加载:</span>
                    <span className="ml-2 font-semibold text-green-400">
                      {systemStatus.mods.loaded}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">已启用:</span>
                    <span className="ml-2 font-semibold text-blue-400">
                      {systemStatus.mods.enabled}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mod List */}
            {mods.map((mod) => (
              <div
                key={mod.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{mod.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getModTypeColor(
                        mod.type
                      )}`}
                    >
                      {getModTypeLabel(mod.type)}
                    </span>
                    <span className="text-sm text-gray-400">v{mod.version}</span>
                    {mod.loaded && (
                      <span className="text-xs text-green-400">● 已加载</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{mod.description}</p>
                  {mod.author && (
                    <p className="text-gray-500 text-xs mt-1">作者: {mod.author}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReloadMod(mod.id)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                    disabled={!mod.loaded}
                  >
                    重载
                  </button>
                  <button
                    onClick={() => handleToggleMod(mod.id, mod.enabled)}
                    className={`px-4 py-2 rounded font-semibold ${
                      mod.enabled
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {mod.enabled ? '已启用' : '已禁用'}
                  </button>
                </div>
              </div>
            ))}

            {mods.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <p>没有找到任何模组</p>
                <p className="text-sm mt-2">
                  将模组放在 <code className="bg-gray-700 px-2 py-1 rounded">backend/mods/</code>{' '}
                  目录下
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'i18n' && (
          <I18nPanel systemStatus={systemStatus} onUpdate={fetchData} />
        )}

        {activeTab === 'rulesets' && (
          <RulesetPanel systemStatus={systemStatus} onUpdate={fetchData} />
        )}

        {activeTab === 'data' && <DataPanel systemStatus={systemStatus} />}
      </div>
    </div>
  );
}

// i18n 面板
function I18nPanel({ systemStatus, onUpdate }) {
  const [selectedLocale, setSelectedLocale] = useState(
    systemStatus?.i18n?.currentLocale || 'zh-CN'
  );

  const handleSetLocale = async (locale) => {
    try {
      await axios.post(`${API_URL}/api/i18n/locale`, { locale });
      setSelectedLocale(locale);
      onUpdate();
      alert(`语言已设置为: ${locale}`);
    } catch (error) {
      console.error('Failed to set locale:', error);
      alert(`设置失败: ${error.message}`);
    }
  };

  const locales = systemStatus?.i18n?.availableLocales || [];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">当前语言</h2>
        <p className="text-gray-400 mb-4">选择界面语言:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleSetLocale(locale)}
              className={`p-4 rounded-lg text-left transition-colors ${
                selectedLocale === locale
                  ? 'bg-dnd-purple text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold">{locale}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">添加新语言</h2>
        <p className="text-gray-400 text-sm mb-4">
          创建语言包模组来添加新的翻译。语言包文件应放在{' '}
          <code className="bg-gray-700 px-2 py-1 rounded">mods/core/i18n/locales/</code>{' '}
          目录下。
        </p>
        <a
          href="https://github.com/your-repo/docs/modding#i18n"
          target="_blank"
          rel="noopener noreferrer"
          className="text-dnd-purple hover:underline"
        >
          查看语言包开发文档 →
        </a>
      </div>
    </div>
  );
}

// 规则集面板
function RulesetPanel({ systemStatus, onUpdate }) {
  const [selectedRuleset, setSelectedRuleset] = useState(
    systemStatus?.rulesets?.current || 'dnd5e'
  );

  const handleSetRuleset = async (rulesetId) => {
    try {
      await axios.post(`${API_URL}/api/rulesets/set`, { rulesetId });
      setSelectedRuleset(rulesetId);
      onUpdate();
      alert('规则集已更新');
    } catch (error) {
      console.error('Failed to set ruleset:', error);
      alert(`设置失败: ${error.message}`);
    }
  };

  const rulesets = systemStatus?.rulesets?.available || [];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">当前规则集</h2>
        <p className="text-gray-400 mb-4">
          当前使用: <span className="text-white font-semibold">{selectedRuleset}</span>
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">可用规则集</h2>
        <div className="space-y-3">
          {rulesets.map((ruleset) => (
            <div
              key={ruleset.id}
              className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">{ruleset.name}</h3>
                <p className="text-gray-400 text-sm">{ruleset.description}</p>
                <p className="text-gray-500 text-xs mt-1">版本: {ruleset.version}</p>
              </div>
              <button
                onClick={() => handleSetRuleset(ruleset.id)}
                className={`px-4 py-2 rounded font-semibold ${
                  selectedRuleset === ruleset.id
                    ? 'bg-green-600'
                    : 'bg-dnd-purple hover:bg-dnd-purple-dark'
                }`}
                disabled={selectedRuleset === ruleset.id}
              >
                {selectedRuleset === ruleset.id ? '当前使用' : '启用'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 数据面板
function DataPanel({ systemStatus }) {
  const stats = systemStatus?.data || {};

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">数据统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([type, count]) => (
            <div key={type} className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-dnd-purple">{count}</div>
              <div className="text-gray-400 text-sm capitalize">{type}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">关于数据包</h2>
        <p className="text-gray-400 text-sm">
          数据包包含游戏数据，如怪物、物品、法术等。这些数据由模组提供，可以通过安装额外的模组来扩展。
        </p>
      </div>
    </div>
  );
}
