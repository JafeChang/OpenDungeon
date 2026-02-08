/**
 * Rule Engine
 * 规则引擎，支持多规则集（D&D 5e、Pathfinder、自定义等）
 */

import { getDatabase } from '../config/database.js';

class RuleEngine {
  constructor() {
    this.rulesets = new Map(); // rulesetId -> ruleset definition
    this.currentRuleset = 'dnd5e'; // 默认 D&D 5e

    // 加载内置规则集
    this.loadBuiltinRulesets();
  }

  /**
   * 加载内置规则集
   */
  loadBuiltinRulesets() {
    // D&D 5e 规则集
    this.registerRuleset('dnd5e', {
      name: 'D&D 5th Edition',
      version: '1.0',
      description: 'Official D&D 5e rules',

      // 属性
      abilities: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],

      // 技能列表
      skills: [
        'acrobatics', 'animal_handling', 'arcana', 'athletics',
        'deception', 'history', 'insight', 'intimidation',
        'investigation', 'medicine', 'nature', 'perception',
        'performance', 'persuasion', 'religion', 'sleight_of_hand',
        'stealth', 'survival'
      ],

      // 条件列表
      conditions: [
        'blinded', 'charmed', 'deafened', 'exhausted', 'frightened',
        'grappled', 'incapacitated', 'invisible', 'paralyzed',
        'petrified', 'poisoned', 'prone', 'restrained', 'stunned',
        'unconscious'
      ],

      // 属性到技能的映射
      skillAbilities: {
        acrobatics: 'DEX', animal_handling: 'WIS', arcana: 'INT',
        athletics: 'STR', deception: 'CHA', history: 'INT',
        insight: 'WIS', intimidation: 'CHA', investigation: 'INT',
        medicine: 'WIS', nature: 'INT', perception: 'WIS',
        performance: 'CHA', persuasion: 'CHA', religion: 'INT',
        sleight_of_hand: 'DEX', stealth: 'DEX', survival: 'WIS'
      },

      // 计算属性修正值
      calculateModifier: (score) => Math.floor((score - 10) / 2),

      // 计算熟练加值
      getProficiencyBonus: (level) => {
        if (level >= 17) return 6;
        if (level >= 13) return 5;
        if (level >= 9) return 4;
        if (level >= 5) return 3;
        return 2;
      },

      // 计算护甲等级
      calculateAC: (character) => {
        // 基础实现，可以扩展
        return character.armor_class || 10;
      },

      // 计算先攻
      calculateInitiative: (character) => {
        return character.initiative !== undefined
          ? character.initiative
          : character.modifiers?.DEX || 0;
      },

      // 骰子规则
      dice: {
        criticalRange: 20,      // 暴击范围
        fumbleRange: 1,         // 大失败范围
        advantageOnRoll: true,   // 支持优势
        disadvantageOnRoll: true // 支持劣势
      },

      // 默认角色创建模板
      defaultCharacter: {
        level: 1,
        hp: { current: 10, max: 10, temp: 0 },
        stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        proficiency_bonus: 2,
        armor_class: 10,
        initiative: 0,
        speed: 30,
        skills: {},
        inventory: [],
        conditions: []
      }
    });
  }

  /**
   * 注册新规则集
   */
  registerRuleset(id, ruleset) {
    // 验证规则集
    if (!this.validateRuleset(ruleset)) {
      throw new Error(`Invalid ruleset: ${id}`);
    }

    this.rulesets.set(id, {
      id,
      ...ruleset,
      custom: true
    });

    console.log(`Registered ruleset: ${id} - ${ruleset.name}`);
  }

  /**
   * 验证规则集
   */
  validateRuleset(ruleset) {
    const required = ['name', 'version', 'abilities'];
    return required.every(field => field in ruleset);
  }

  /**
   * 获取规则集
   */
  getRuleset(id) {
    return this.rulesets.get(id);
  }

  /**
   * 获取当前规则集
   */
  getCurrentRuleset() {
    return this.rulesets.get(this.currentRuleset);
  }

  /**
   * 设置当前规则集
   */
  setCurrentRuleset(id) {
    if (this.rulesets.has(id)) {
      this.currentRuleset = id;
      return true;
    }
    return false;
  }

  /**
   * 列出所有规则集
   */
  listRulesets() {
    return Array.from(this.rulesets.values());
  }

  /**
   * 应用规则集函数
   */
  applyRule(ruleName, ...args) {
    const ruleset = this.getCurrentRuleset();

    if (!ruleset || typeof ruleset[ruleName] !== 'function') {
      console.warn(`Rule not found: ${ruleName}`);
      return null;
    }

    return ruleset[ruleName](...args);
  }

  /**
   * 获取规则集配置
   */
  getRuleConfig(rulePath) {
    const ruleset = this.getCurrentRuleset();
    if (!ruleset) return null;

    const keys = rulePath.split('.');
    let value = ruleset;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * 创建新角色
   */
  createCharacter(data = {}) {
    const ruleset = this.getCurrentRuleset();
    const defaultCharacter = ruleset.defaultCharacter || {};

    return {
      ...defaultCharacter,
      ...data
    };
  }

  /**
   * 验证角色数据
   */
  validateCharacter(character) {
    const ruleset = this.getCurrentRuleset();
    const errors = [];

    // 验证属性
    for (const ability of ruleset.abilities) {
      const value = character.stats?.[ability];
      if (typeof value !== 'number' || value < 1 || value > 30) {
        errors.push(`Invalid ${ability} score: ${value}`);
      }
    }

    // 验证技能
    for (const skill of Object.keys(character.skills || {})) {
      if (!ruleset.skills.includes(skill)) {
        errors.push(`Unknown skill: ${skill}`);
      }
    }

    // 验证条件
    for (const condition of character.conditions || []) {
      if (!ruleset.conditions.includes(condition)) {
        errors.push(`Unknown condition: ${condition}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出规则集为 JSON
   */
  exportRuleset(id) {
    const ruleset = this.getRuleset(id);
    if (!ruleset) return null;

    return JSON.stringify(ruleset, null, 2);
  }

  /**
   * 从 JSON 导入规则集
   */
  importRuleset(json) {
    try {
      const ruleset = JSON.parse(json);

      if (!ruleset.id) {
        ruleset.id = `custom_${Date.now()}`;
      }

      this.registerRuleset(ruleset.id, ruleset);
      return ruleset.id;
    } catch (error) {
      console.error('Failed to import ruleset:', error);
      return null;
    }
  }
}

// 导出单例
export default new RuleEngine();
