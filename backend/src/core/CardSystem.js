/**
 * Card System
 * 卡片系统 - 支持各种类型的游戏卡片（物品卡、法术卡、怪物卡、事件卡等）
 */

import { v4 as uuidv4 } from 'uuid';
import DataManager from './DataManager.js';
import EventBus from './EventBus.js';

class CardSystem {
  constructor() {
    this.cardTypes = new Map(); // 卡片类型定义
    this.decks = new Map();     // 卡组定义
    this.playerDecks = new Map(); // 玩家卡组实例

    // 注册内置卡片类型
    this.registerBuiltinCardTypes();
  }

  /**
   * 注册内置卡片类型
   */
  registerBuiltinCardTypes() {
    // 物品卡
    this.registerCardType('item', {
      name: 'Item',
      description: 'Equipment and consumables',
      schema: {
        id: 'string',
        name: 'string',
        type: 'string',
        rarity: 'string',
        description: 'text',
        effects: 'array'
      },
      render: (card) => this.renderItemCard(card)
    });

    // 法术卡
    this.registerCardType('spell', {
      name: 'Spell',
      description: 'Magical spells',
      schema: {
        id: 'string',
        name: 'string',
        level: 'number',
        school: 'string',
        casting_time: 'string',
        duration: 'string',
        components: 'array',
        description: 'text'
      },
      render: (card) => this.renderSpellCard(card)
    });

    // 怪物卡
    this.registerCardType('monster', {
      name: 'Monster',
      description: 'Creature cards',
      schema: {
        id: 'string',
        name: 'string',
        cr: 'number',
        hp: 'string',
        ac: 'number',
        stats: 'object',
        actions: 'array'
      },
      render: (card) => this.renderMonsterCard(card)
    });

    // 事件卡
    this.registerCardType('event', {
      name: 'Event',
      description: 'Random encounters and story events',
      schema: {
        id: 'string',
        name: 'string',
        type: 'string',
        description: 'text',
        choices: 'array',
        effects: 'object'
      },
      render: (card) => this.renderEventCard(card)
    });

    // 特性卡
    this.registerCardType('feature', {
      name: 'Feature',
      description: 'Class features and feats',
      schema: {
        id: 'string',
        name: 'string',
        source: 'string',
        level: 'number',
        description: 'text'
      },
      render: (card) => this.renderFeatureCard(card)
    });

    // 条件卡
    this.registerCardType('condition', {
      name: 'Condition',
      description: 'Status conditions',
      schema: {
        id: 'string',
        name: 'string',
        description: 'text',
        effects: 'object'
      },
      render: (card) => this.renderConditionCard(card)
    });
  }

  /**
   * 注册卡片类型
   */
  registerCardType(type, definition) {
    this.cardTypes.set(type, {
      type,
      ...definition
    });

    console.log(`Registered card type: ${type}`);
  }

  /**
   * 创建卡片
   */
  createCard(type, data) {
    const cardType = this.cardTypes.get(type);

    if (!cardType) {
      throw new Error(`Unknown card type: ${type}`);
    }

    return {
      id: data.id || uuidv4(),
      type,
      ...data,
      _cardType: cardType
    };
  }

  /**
   * 从数据创建卡片
   */
  createCardFromData(type, dataId) {
    const data = DataManager.getItem(type, dataId);

    if (!data) {
      throw new Error(`${type} not found: ${dataId}`);
    }

    return this.createCard(type, data);
  }

  /**
   * 注册卡组
   */
  registerDeck(deckId, definition) {
    this.decks.set(deckId, {
      id: deckId,
      name: definition.name,
      description: definition.description,
      cards: definition.cards || [],
      drawRule: definition.drawRule || 'random',
      shuffle: definition.shuffle !== false,
      maxSize: definition.maxSize || 60
    });

    console.log(`Registered deck: ${deckId}`);
  }

  /**
   * 创建卡组实例
   */
  createDeckInstance(deckId, ownerId) {
    const deck = this.decks.get(deckId);

    if (!deck) {
      throw new Error(`Deck not found: ${deckId}`);
    }

    const instanceId = `${deckId}_${ownerId}_${Date.now()}`;

    // 创建卡片实例
    const cards = deck.cards.map(cardDef => {
      const card = this.createCardFromData(cardDef.type, cardDef.id);
      return {
        ...card,
        instanceId: uuidv4(),
        deckId: instanceId
      };
    });

    // 洗牌
    const shuffledCards = deck.shuffle ? this.shuffle(cards) : cards;

    const instance = {
      instanceId,
      deckId,
      ownerId,
      name: deck.name,
      cards: shuffledCards,
      drawPile: [...shuffledCards],
      discardPile: [],
      hand: [],
      inPlay: []
    };

    this.playerDecks.set(instanceId, instance);

    return instance;
  }

  /**
   * 洗牌算法
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 从卡组抽卡
   */
  drawCard(deckInstanceId, count = 1) {
    const deck = this.playerDecks.get(deckInstanceId);

    if (!deck) {
      throw new Error(`Deck instance not found: ${deckInstanceId}`);
    }

    const drawn = [];

    for (let i = 0; i < count; i++) {
      if (deck.drawPile.length === 0) {
        // 重洗弃牌堆
        if (deck.discardPile.length > 0) {
          deck.drawPile = this.shuffle(deck.discardPile);
          deck.discardPile = [];
        } else {
          break; // 没有卡可抽了
        }
      }

      const card = deck.drawPile.pop();
      deck.hand.push(card);
      drawn.push(card);
    }

    // 触发事件
    EventBus.emit('card_drawn', {
      deckInstanceId,
      cards: drawn
    });

    return drawn;
  }

  /**
   * 打出卡片
   */
  playCard(deckInstanceId, cardInstanceId) {
    const deck = this.playerDecks.get(deckInstanceId);

    if (!deck) {
      throw new Error(`Deck instance not found: ${deckInstanceId}`);
    }

    const cardIndex = deck.hand.findIndex(c => c.instanceId === cardInstanceId);

    if (cardIndex === -1) {
      throw new Error(`Card not in hand: ${cardInstanceId}`);
    }

    const [card] = deck.hand.splice(cardIndex, 1);
    deck.inPlay.push(card);

    // 触发事件
    EventBus.emit('card_played', {
      deckInstanceId,
      card
    });

    return card;
  }

  /**
   * 弃卡
   */
  discardCard(deckInstanceId, cardInstanceId) {
    const deck = this.playerDecks.get(deckInstanceId);

    if (!deck) {
      throw new Error(`Deck instance not found: ${deckInstanceId}`);
    }

    // 从手牌查找
    let cardIndex = deck.hand.findIndex(c => c.instanceId === cardInstanceId);

    if (cardIndex !== -1) {
      const [card] = deck.hand.splice(cardIndex, 1);
      deck.discardPile.push(card);

      EventBus.emit('card_discarded', {
        deckInstanceId,
        card,
        source: 'hand'
      });

      return card;
    }

    // 从战场查找
    cardIndex = deck.inPlay.findIndex(c => c.instanceId === cardInstanceId);

    if (cardIndex !== -1) {
      const [card] = deck.inPlay.splice(cardIndex, 1);
      deck.discardPile.push(card);

      EventBus.emit('card_discarded', {
        deckInstanceId,
        card,
        source: 'play'
      });

      return card;
    }

    throw new Error(`Card not found: ${cardInstanceId}`);
  }

  /**
   * 获取卡组实例
   */
  getDeckInstance(instanceId) {
    return this.playerDecks.get(instanceId);
  }

  /**
   * 删除卡组实例
   */
  deleteDeckInstance(instanceId) {
    return this.playerDecks.delete(instanceId);
  }

  /**
   * 卡片渲染方法 - 物品卡
   */
  renderItemCard(card) {
    return {
      title: card.name,
      subtitle: `${card.type} - ${card.rarity || 'Common'}`,
      description: card.description,
      stats: {
        '类型': card.type,
        '稀有度': card.rarity || '普通'
      },
      color: this.getRarityColor(card.rarity)
    };
  }

  /**
   * 卡片渲染方法 - 法术卡
   */
  renderSpellCard(card) {
    return {
      title: card.name,
      subtitle: `${card.school} - ${card.level} Level`,
      description: card.description,
      stats: {
        '施法时间': card.casting_time,
        '持续时间': card.duration,
        '成分': card.components?.join(', ') || 'V, S, M'
      },
      color: this.getSchoolColor(card.school)
    };
  }

  /**
   * 卡片渲染方法 - 怪物卡
   */
  renderMonsterCard(card) {
    const stats = card.stats || {};
    return {
      title: card.name,
      subtitle: `CR ${card.cr}`,
      description: card.description || '',
      stats: {
        'HP': card.hp,
        'AC': card.ac,
        '力量': stats.STR || '-',
        '敏捷': stats.DEX || '-',
        '体质': stats.CON || '-'
      },
      color: 'red'
    };
  }

  /**
   * 卡片渲染方法 - 事件卡
   */
  renderEventCard(card) {
    return {
      title: card.name,
      subtitle: card.type || 'Event',
      description: card.description,
      choices: card.choices,
      color: 'purple'
    };
  }

  /**
   * 卡片渲染方法 - 特性卡
   */
  renderFeatureCard(card) {
    return {
      title: card.name,
      subtitle: `${card.source} - Level ${card.level}`,
      description: card.description,
      color: 'blue'
    };
  }

  /**
   * 卡片渲染方法 - 条件卡
   */
  renderConditionCard(card) {
    return {
      title: card.name,
      description: card.description,
      color: 'orange'
    };
  }

  /**
   * 获取稀有度颜色
   */
  getRarityColor(rarity) {
    const colors = {
      'common': 'gray',
      'uncommon': 'green',
      'rare': 'blue',
      'very rare': 'purple',
      'legendary': 'yellow',
      'artifact': 'red'
    };
    return colors[rarity?.toLowerCase()] || 'gray';
  }

  /**
   * 获取法术学派颜色
   */
  getSchoolColor(school) {
    const colors = {
      'abjuration': 'blue',
      'conjuration': 'yellow',
      'divination': 'purple',
      'enchantment': 'pink',
      'evocation': 'red',
      'illusion': 'cyan',
      'necromancy': 'gray',
      'transmutation': 'green'
    };
    return colors[school?.toLowerCase()] || 'gray';
  }

  /**
   * 搜索卡片
   */
  searchCards(type, query) {
    const items = DataManager.getAllItems(type);
    return items.filter(item => {
      const search = `${item.name} ${item.description || ''}`.toLowerCase();
      return search.includes(query.toLowerCase());
    }).map(item => this.createCard(type, item));
  }

  /**
   * 创建预构建卡组
   */
  createPrebuiltDecks() {
    // 初学者装备卡组
    this.registerDeck('starter_equipment', {
      name: '初学者装备',
      description: '基本冒险装备',
      cards: [
        { type: 'items', id: 'weapon_longsword' },
        { type: 'items', id: 'weapon_longsword' },
        { type: 'items', id: 'item_health_potion' },
        { type: 'items', id: 'item_torch' },
        { type: 'items', id: 'item_rope' }
      ]
    });

    // 法术卡组
    this.registerDeck('basic_spells', {
      name: '基础法术',
      description: '常用法术',
      cards: [
        { type: 'spells', id: 'spell_fireball' },
        { type: 'spells', id: 'spell_magic_missile' },
        { type: 'spells', id: 'spell_healing_word' },
        { type: 'spells', id: 'spell_shield' },
        { type: 'spells', id: 'spell_lightning_bolt' }
      ]
    });

    // 怪物卡组
    this.registerDeck('basic_monsters', {
      name: '常见怪物',
      description: '低级冒险怪物',
      cards: [
        { type: 'monsters', id: 'monster_goblin' },
        { type: 'monsters', id: 'monster_goblin' },
        { type: 'monsters', id: 'monster_goblin' },
        { type: 'monsters', id: 'monster_skeleton' },
        { type: 'monsters', id: 'monster_zombie' }
      ]
    });
  }

  /**
   * 导出卡组
   */
  exportDeck(deckId) {
    const deck = this.decks.get(deckId);
    if (!deck) return null;

    return JSON.stringify(deck, null, 2);
  }

  /**
   * 导入卡组
   */
  importDeck(deckData) {
    try {
      const deck = JSON.parse(deckData);

      if (!deck.id) {
        deck.id = `custom_${Date.now()}`;
      }

      this.registerDeck(deck.id, deck);
      return deck.id;
    } catch (error) {
      console.error('Failed to import deck:', error);
      return null;
    }
  }
}

// 导出单例
export default new CardSystem();
