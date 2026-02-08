import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '../components/Card';
import { CardGrid, CardList } from '../components/Card';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DeckManager() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('items');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/cards/decks`);
      setDecks(response.data);
    } catch (error) {
      console.error('Failed to fetch decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDeck = async (deckId) => {
    if (activeDeck?.id === deckId) {
      setActiveDeck(null);
      setDeckCards([]);
      return;
    }

    const deck = decks.find(d => d.id === deckId);
    if (deck) {
      setActiveDeck(deck);
      // 创建临时实例查看卡片
      setDeckCards(deck.cards || []);
    }
  };

  const handleCreateInstance = async (deckId) => {
    const playerId = localStorage.getItem('playerId') || uuidv4();
    localStorage.setItem('playerId', playerId);

    try {
      const response = await axios.post(`${API_URL}/api/cards/decks/${deckId}/create`, {
        ownerId: playerId
      });

      setActiveDeck(response.data);
      setDeckCards(response.data.drawPile || []);
      alert('卡组实例已创建！');
    } catch (error) {
      console.error('Failed to create deck instance:', error);
      alert('创建失败: ' + error.message);
    }
  };

  const handleDrawCards = async () => {
    if (!activeDeck?.instanceId) {
      alert('请先创建卡组实例');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/cards/decks/${activeDeck.instanceId}/draw`, {
        count: 1
      });

      setDeckCards(prev => [...response.data.cards, ...prev]);
    } catch (error) {
      console.error('Failed to draw cards:', error);
      alert('抽卡失败: ' + error.message);
    }
  };

  const handleSearchCards = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/cards/search`, {
        params: { type: searchType, q: searchQuery }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardToDeck = (card) => {
    // TODO: 实现添加卡片到自定义卡组
    alert(`添加 ${card.name} 到卡组（功能开发中）`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white mb-2"
          >
            ← 返回大厅
          </button>
          <h1 className="text-3xl font-bold">卡组管理器</h1>
          <p className="text-gray-400 mt-1">管理游戏卡片和卡组</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：卡组列表 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">可用卡组</h2>

              {decks.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  暂无卡组
                </div>
              ) : (
                <div className="space-y-2">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeDeck?.id === deck.id
                          ? 'bg-dnd-purple'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => handleSelectDeck(deck.id)}
                    >
                      <div className="font-semibold">{deck.name}</div>
                      <div className="text-sm text-gray-300">{deck.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {deck.cards?.length || 0} 张卡片
                      </div>

                      {activeDeck?.id === deck.id && !activeDeck.instanceId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateInstance(deck.id);
                          }}
                          className="mt-2 w-full py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm"
                        >
                          创建实例
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 创建自定义卡组按钮 */}
              <button
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-600 hover:border-dnd-purple rounded-lg text-gray-400 hover:text-white transition-colors"
                onClick={() => alert('自定义卡组创建器（功能开发中）')}
              >
                + 创建新卡组
              </button>
            </div>

            {/* 卡片搜索 */}
            <div className="bg-gray-800 rounded-lg p-4 mt-6">
              <h2 className="text-xl font-semibold mb-4">搜索卡片</h2>

              <div className="space-y-3">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                >
                  <option value="items">物品</option>
                  <option value="spells">法术</option>
                  <option value="monsters">怪物</option>
                </select>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCards()}
                  placeholder="输入搜索关键词..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                />

                <button
                  onClick={handleSearchCards}
                  disabled={loading || !searchQuery.trim()}
                  className="w-full py-2 bg-dnd-purple hover:bg-dnd-purple-dark disabled:bg-gray-600 rounded-lg"
                >
                  搜索
                </button>
              </div>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-64 overflow-y-auto">
                  <div className="text-sm text-gray-400 mb-2">
                    找到 {searchResults.length} 个结果
                  </div>
                  <CardList
                    cards={searchResults}
                    onCardClick={(card) => handleAddCardToDeck(card)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 右侧：卡片展示 */}
          <div className="lg:col-span-2">
            {activeDeck ? (
              <div className="bg-gray-800 rounded-lg p-6">
                {/* 卡组信息 */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{activeDeck.name}</h2>
                    <p className="text-gray-400">{activeDeck.description}</p>
                  </div>

                  {activeDeck.instanceId && (
                    <button
                      onClick={handleDrawCards}
                      className="px-6 py-3 bg-dnd-purple hover:bg-dnd-purple-dark rounded-lg font-semibold"
                    >
                      抽卡
                    </button>
                  )}
                </div>

                {/* 统计信息 */}
                {activeDeck.instanceId && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-dnd-purple">
                        {activeDeck.drawPile?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">抽卡堆</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {activeDeck.hand?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">手牌</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {activeDeck.inPlay?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">战场</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {activeDeck.discardPile?.length || 0}
                      </div>
                      <div className="text-sm text-gray-400">弃牌堆</div>
                    </div>
                  </div>
                )}

                {/* 视图切换 */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {activeDeck.instanceId ? '当前卡片' : '卡组内容'}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setView('list')}
                      className={`px-3 py-1 rounded ${
                        view === 'list' ? 'bg-dnd-purple' : 'bg-gray-700'
                      }`}
                    >
                      列表
                    </button>
                    <button
                      onClick={() => setView('grid')}
                      className={`px-3 py-1 rounded ${
                        view === 'grid' ? 'bg-dnd-purple' : 'bg-gray-700'
                      }`}
                    >
                      网格
                    </button>
                  </div>
                </div>

                {/* 卡片展示 */}
                {deckCards.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    {activeDeck.instanceId ? '抽卡堆为空' : '此卡组没有卡片'}
                  </div>
                ) : view === 'grid' ? (
                  <CardGrid cards={deckCards} compact />
                ) : (
                  <CardList cards={deckCards} />
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🃏</div>
                <h2 className="text-2xl font-bold mb-2">选择一个卡组</h2>
                <p className="text-gray-400">
                  从左侧列表选择一个卡组开始，或创建新的自定义卡组
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
