/**
 * Mod Management API
 * 模组管理 API
 */

import ModLoader from '../core/ModLoader.js';
import I18nManager from '../core/I18nManager.js';
import RuleEngine from '../core/RuleEngine.js';
import DataManager from '../core/DataManager.js';

/**
 * 获取所有模组信息
 */
export function getAllMods() {
  return ModLoader.listMods();
}

/**
 * 获取单个模组信息
 */
export function getMod(modId) {
  return ModLoader.getMod(modId);
}

/**
 * 启用模组
 */
export function enableMod(modId) {
  return ModLoader.setModEnabled(modId, true);
}

/**
 * 禁用模组
 */
export function disableMod(modId) {
  return ModLoader.setModEnabled(modId, false);
}

/**
 * 重载模组
 */
export async function reloadMod(modId) {
  await ModLoader.unloadMod(modId);
  await ModLoader.loadMod(modId);
  return true;
}

/**
 * 安装新模组
 */
export async function installMod(modData) {
  // TODO: 实现模组上传和安装逻辑
  // 这需要文件上传功能
  return { success: false, message: 'Mod installation not yet implemented' };
}

/**
 * 获取模组依赖信息
 */
export function getModDependencies(modId) {
  const mod = ModLoader.getMod(modId);
  return mod?.dependencies || [];
}

/**
 * 检查模组冲突
 */
export function checkModConflicts(modId) {
  const mod = ModLoader.getMod(modId);
  if (!mod) return { conflicts: [] };

  // TODO: 实现冲突检查逻辑
  return { conflicts: [] };
}

/**
 * 获取系统状态
 */
export function getSystemStatus() {
  return {
    mods: {
      total: ModLoader.listMods().length,
      loaded: Array.from(ModLoader.mods.values()).filter(m => m.loaded).length,
      enabled: Array.from(ModLoader.mods.values()).filter(m => m.enabled).length
    },
    i18n: {
      currentLocale: I18nManager.getLocale(),
      availableLocales: I18nManager.getAvailableLocales()
    },
    rulesets: {
      current: RuleEngine.currentRuleset,
      available: RuleEngine.listRulesets()
    },
    data: DataManager.getStats()
  };
}

/**
 * 获取可用语言
 */
export function getAvailableLocales() {
  return I18nManager.getAvailableLocales().map(locale => ({
    code: locale,
    name: I18nManager.getLocaleDisplayName(locale)
  }));
}

/**
 * 设置语言
 */
export function setLocale(locale) {
  return I18nManager.setLocale(locale);
}

/**
 * 获取翻译
 */
export function getTranslations(locale) {
  return I18nManager.exportTranslations(locale);
}

/**
 * 获取可用规则集
 */
export function getAvailableRulesets() {
  return RuleEngine.listRulesets();
}

/**
 * 设置规则集
 */
export function setRuleset(rulesetId) {
  return RuleEngine.setCurrentRuleset(rulesetId);
}

/**
 * 创建新规则集
 */
export function createRuleset(ruleset) {
  const id = `custom_${Date.now()}`;
  RuleEngine.registerRuleset(id, ruleset);
  return id;
}

/**
 * 获取数据统计
 */
export function getDataStats() {
  return DataManager.getStats();
}

/**
 * 搜索游戏数据
 */
export function searchData(type, query) {
  return DataManager.search(type, query);
}

/**
 * 获取游戏数据
 */
export function getDataItem(type, id) {
  return DataManager.getItem(type, id);
}

export default {
  getAllMods,
  getMod,
  enableMod,
  disableMod,
  reloadMod,
  installMod,
  getModDependencies,
  checkModConflicts,
  getSystemStatus,
  getAvailableLocales,
  setLocale,
  getTranslations,
  getAvailableRulesets,
  setRuleset,
  createRuleset,
  getDataStats,
  searchData,
  getDataItem
};
