/**
 * Internationalization (i18n) Manager
 * 多语言管理系统
 */

class I18nManager {
  constructor() {
    this.currentLocale = 'zh-CN'; // 默认中文
    this.fallbackLocale = 'en-US';
    this.translations = new Map(); // locale -> translations object
    this.pluralRules = new Map();  // locale -> pluralization function

    // 加载内置翻译
    this.loadBuiltinTranslations();
  }

  /**
   * 加载内置翻译
   */
  loadBuiltinTranslations() {
    // 英文（回退语言）
    this.addTranslations('en-US', {
      'app.name': 'AI Dungeon Master',
      'app.subtitle': 'D&D 5e TTRPG Platform',

      // UI
      'ui.create_room': 'Create Room',
      'ui.join_room': 'Join Room',
      'ui.settings': 'Settings',
      'ui.send': 'Send',
      'ui.leave': 'Leave',

      // Game
      'game.dm': 'DM',
      'game.player': 'Player',
      'game.roll': 'Roll',
      'game.advantage': 'Advantage',
      'game.disadvantage': 'Disadvantage',
      'game.critical_hit': 'CRITICAL HIT!',
      'game.critical_fail': 'CRITICAL FAIL!',

      // Stats
      'stat.strength': 'Strength',
      'stat.dexterity': 'Dexterity',
      'stat.constitution': 'Constitution',
      'stat.intelligence': 'Intelligence',
      'stat.wisdom': 'Wisdom',
      'stat.charisma': 'Charisma',

      // Skills
      'skill.acrobatics': 'Acrobatics',
      'skill.perception': 'Perception',
      'skill.stealth': 'Stealth',
      // ... more skills
    });

    // 中文（默认）
    this.addTranslations('zh-CN', {
      'app.name': 'AI 地下城主',
      'app.subtitle': 'D&D 5e 桌面角色扮演游戏平台',

      // UI
      'ui.create_room': '创建房间',
      'ui.join_room': '加入房间',
      'ui.settings': '设置',
      'ui.send': '发送',
      'ui.leave': '离开',

      // Game
      'game.dm': 'DM',
      'game.player': '玩家',
      'game.roll': '投掷',
      'game.advantage': '优势',
      'game.disadvantage': '劣势',
      'game.critical_hit': '🎯 暴击！',
      'game.critical_fail': '❌ 大失败！',

      // Stats
      'stat.strength': '力量',
      'stat.dexterity': '敏捷',
      'stat.constitution': '体质',
      'stat.intelligence': '智力',
      'stat.wisdom': '感知',
      'stat.charisma': '魅力',

      // Skills
      'skill.acrobatics': '杂技',
      'skill.perception': '察觉',
      'skill.stealth': '隐匿',
      'skill.animal_handling': '动物驯养',
      'skill.arcana': '奥秘',
      'skill.athletics': '运动',
      'skill.deception': '欺瞒',
      'skill.history': '历史',
      'skill.insight': '洞察',
      'skill.intimidation': '威吓',
      'skill.investigation': '调查',
      'skill.medicine': '医学',
      'skill.nature': '自然',
      'skill.performance': '表演',
      'skill.persuasion': '游说',
      'skill.religion': '宗教',
      'skill.sleight_of_hand': '手部灵巧',
      'skill.survival': '求生'
    });
  }

  /**
   * 添加翻译
   */
  addTranslations(locale, translations) {
    if (!this.translations.has(locale)) {
      this.translations.set(locale, {});
    }

    const existing = this.translations.get(locale);
    this.translations.set(locale, { ...existing, ...translations });
  }

  /**
   * 翻译文本
   * @param {string} key - 翻译键
   * @param {object} params - 参数
   * @param {string} locale - 语言（可选，默认使用当前语言）
   */
  t(key, params = {}, locale = null) {
    const targetLocale = locale || this.currentLocale;

    // 尝试获取翻译
    let translation = this.getNestedValue(targetLocale, key);

    // 如果没有翻译，尝试回退语言
    if (!translation && targetLocale !== this.fallbackLocale) {
      translation = this.getNestedValue(this.fallbackLocale, key);
    }

    // 如果还是没有，返回键本身
    if (!translation) {
      return key;
    }

    // 替换参数
    if (params && typeof translation === 'string') {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * 获取嵌套对象的值
   */
  getNestedValue(locale, key) {
    const translations = this.translations.get(locale);
    if (!translations) return null;

    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * 插值替换
   */
  interpolate(template, params) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  /**
   * 复数形式翻译
   */
  tn(key, count, params = {}, locale = null) {
    const targetLocale = locale || this.currentLocale;
    const pluralRule = this.pluralRules.get(targetLocale);

    let pluralForm;
    if (pluralRule) {
      pluralForm = pluralRule(count);
    } else {
      // 默认英语复数规则
      pluralForm = count === 1 ? 'one' : 'other';
    }

    const pluralKey = `${key}.${pluralForm}`;
    return this.t(pluralKey, { count, ...params }, locale);
  }

  /**
   * 设置当前语言
   */
  setLocale(locale) {
    if (this.translations.has(locale)) {
      this.currentLocale = locale;
      return true;
    }
    return false;
  }

  /**
   * 获取当前语言
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * 获取可用语言列表
   */
  getAvailableLocales() {
    return Array.from(this.translations.keys());
  }

  /**
   * 检查语言是否可用
   */
  hasLocale(locale) {
    return this.translations.has(locale);
  }

  /**
   * 获取语言的显示名称
   */
  getLocaleDisplayName(locale, displayLocale = null) {
    const names = {
      'en-US': 'English',
      'zh-CN': '简体中文',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
      'es-ES': 'Español',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch',
      'ru-RU': 'Русский'
    };

    return names[locale] || locale;
  }

  /**
   * 导出所有翻译（用于前端）
   */
  exportTranslations(locale) {
    return this.translations.get(locale) || {};
  }

  /**
   * 从 JSON 文件加载翻译
   */
  async loadFromFile(locale, filePath) {
    try {
      const fs = await import('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(content);
      this.addTranslations(locale, translations);
      return true;
    } catch (error) {
      console.error(`Failed to load translations from ${filePath}:`, error);
      return false;
    }
  }
}

// 导出单例
export default new I18nManager();
