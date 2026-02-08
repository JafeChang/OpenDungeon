/**
 * Content Management API
 * 内容管理 API - 卡片、地下城等
 */

import CardSystem from '../core/CardSystem.js';
import DungeonGenerator from '../core/DungeonGenerator.js';

/**
 * ============ 卡片系统 API ============
 */

/**
 * 获取所有卡片类型
 */
export function getCardTypes() {
  return Array.from(CardSystem.cardTypes.values());
}

/**
 * 创建卡组实例
 */
export function createDeckInstance(deckId, ownerId) {
  return CardSystem.createDeckInstance(deckId, ownerId);
}

/**
 * 从卡组抽卡
 */
export function drawCard(deckInstanceId, count = 1) {
  return CardSystem.drawCard(deckInstanceId, count);
}

/**
 * 打出卡片
 */
export function playCard(deckInstanceId, cardInstanceId) {
  return CardSystem.playCard(deckInstanceId, cardInstanceId);
}

/**
 * 弃卡
 */
export function discardCard(deckInstanceId, cardInstanceId) {
  return CardSystem.discardCard(deckInstanceId, cardInstanceId);
}

/**
 * 获取卡组实例
 */
export function getDeckInstance(deckInstanceId) {
  return CardSystem.getDeckInstance(deckInstanceId);
}

/**
 * 获取所有卡组定义
 */
export function getAllDecks() {
  return Array.from(CardSystem.decks.values());
}

/**
 * 搜索卡片
 */
export function searchCards(type, query) {
  return CardSystem.searchCards(type, query);
}

/**
 * 导出卡组
 */
export function exportDeck(deckId) {
  return CardSystem.exportDeck(deckId);
}

/**
 * 导入卡组
 */
export function importDeck(deckData) {
  return CardSystem.importDeck(deckData);
}

/**
 * 创建自定义卡组
 */
export function createCustomDeck(deckData) {
  const deckId = `custom_${Date.now()}`;

  CardSystem.registerDeck(deckId, {
    ...deckData,
    id: deckId
  });

  return deckId;
}

/**
 * ============ 地下城生成 API ============
 */

/**
 * 生成地下城
 */
export function generateDungeon(options) {
  return DungeonGenerator.generateDungeon(options);
}

/**
 * 获取地下城
 */
export function getDungeon(dungeonId) {
  // TODO: 实现地下城存储
  return null;
}

/**
 * 导出地下城
 */
export function exportDungeon(dungeon) {
  return DungeonGenerator.exportDungeon(dungeon);
}

/**
 * 导入地下城
 */
export function importDungeon(dungeonData) {
  return DungeonGenerator.importDungeon(dungeonData);
}

/**
 * 获取房间类型列表
 */
export function getRoomTypes() {
  return Array.from(DungeonGenerator.roomTypes.values());
}

/**
 * 获取地下城主题列表
 */
export function getDungeonThemes() {
  return Array.from(DungeonGenerator.dungeonThemes.values());
}

/**
 * 创建自定义地下城主题
 */
export function createDungeonTheme(themeId, theme) {
  DungeonGenerator.registerDungeonTheme(themeId, theme);
  return true;
}

export default {
  // 卡片系统
  getCardTypes,
  createDeckInstance,
  drawCard,
  playCard,
  discardCard,
  getDeckInstance,
  getAllDecks,
  searchCards,
  exportDeck,
  importDeck,
  createCustomDeck,

  // 地下城生成
  generateDungeon,
  getDungeon,
  exportDungeon,
  importDungeon,
  getRoomTypes,
  getDungeonThemes,
  createDungeonTheme
};
