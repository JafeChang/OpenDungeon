/**
 * Data Manager
 * 数据管理器，处理游戏数据（怪物、物品、法术等）
 */

import fs from 'fs';
import path from 'path';

class DataManager {
  constructor() {
    this.data = new Map(); // dataType -> data map
    this.dataPaths = [];   // 数据文件搜索路径

    // 初始化数据类型
    this.initializeDataTypes();
  }

  /**
   * 初始化数据类型
   */
  initializeDataTypes() {
    this.registerDataType('monsters', {
      schema: {
        id: 'string',
        name: 'string',
        cr: 'number',
        hp: 'string',
        ac: 'number',
        stats: 'object',
        actions: 'array'
      }
    });

    this.registerDataType('items', {
      schema: {
        id: 'string',
        name: 'string',
        type: 'string',
        rarity: 'string',
        description: 'string'
      }
    });

    this.registerDataType('spells', {
      schema: {
        id: 'string',
        name: 'string',
        level: 'number',
        school: 'string',
        casting_time: 'string',
        duration: 'string',
        components: 'array',
        description: 'string'
      }
    });

    this.registerDataType('classes', {
      schema: {
        id: 'string',
        name: 'string',
        hit_die: 'string',
        primary_ability: 'array',
        saving_throws: 'array',
        features: 'array'
      }
    });

    this.registerDataType('races', {
      schema: {
        id: 'string',
        name: 'string',
        ability_bonuses: 'object',
        traits: 'array',
        speed: 'number'
      }
    });

    this.registerDataType('backgrounds', {
      schema: {
        id: 'string',
        name: 'string',
        skills: 'array',
        tools: 'array',
        languages: 'array',
        feature: 'string'
      }
    });
  }

  /**
   * 注册数据类型
   */
  registerDataType(type, config) {
    this.data.set(type, new Map());
    this.data[`${type}_config`] = config;
  }

  /**
   * 从目录加载数据
   */
  async loadFromDirectory(directory, modId = 'core') {
    if (!fs.existsSync(directory)) {
      console.warn(`Data directory does not exist: ${directory}`);
      return;
    }

    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const type = entry.name;
        const typePath = path.join(directory, type);

        if (this.data.has(type)) {
          await this.loadDataType(type, typePath, modId);
        }
      }
    }
  }

  /**
   * 加载特定类型的数据
   */
  async loadDataType(type, directory, modId) {
    const files = fs.readdirSync(directory).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const filePath = path.join(directory, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const items = JSON.parse(content);

        if (Array.isArray(items)) {
          for (const item of items) {
            this.addItem(type, item.id, item, modId);
          }
        } else {
          this.addItem(type, items.id, items, modId);
        }
      } catch (error) {
        console.error(`Failed to load ${file}:`, error);
      }
    }
  }

  /**
   * 添加数据项
   */
  addItem(type, id, data, modId = 'core') {
    if (!this.data.has(type)) {
      console.warn(`Unknown data type: ${type}`);
      return false;
    }

    const typeMap = this.data.get(type);
    typeMap.set(id, {
      ...data,
      _mod: modId
    });

    return true;
  }

  /**
   * 获取数据项
   */
  getItem(type, id) {
    if (!this.data.has(type)) return null;
    return this.data.get(type).get(id);
  }

  /**
   * 获取所有数据项
   */
  getAllItems(type, filter = null) {
    if (!this.data.has(type)) return [];

    const items = Array.from(this.data.get(type).values());

    if (filter) {
      return items.filter(filter);
    }

    return items;
  }

  /**
   * 搜索数据
   */
  search(type, query) {
    const items = this.getAllItems(type);
    const lowerQuery = query.toLowerCase();

    return items.filter(item => {
      // 搜索名称和描述
      return (
        (item.name && item.name.toLowerCase().includes(lowerQuery)) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * 按条件筛选
   */
  filter(type, conditions) {
    const items = this.getAllItems(type);

    return items.filter(item => {
      return Object.entries(conditions).every(([key, value]) => {
        const itemValue = this.getNestedValue(item, key);
        return itemValue === value;
      });
    });
  }

  /**
   * 获取嵌套值
   */
  getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;

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
   * 删除数据项
   */
  removeItem(type, id) {
    if (!this.data.has(type)) return false;

    const typeMap = this.data.get(type);
    return typeMap.delete(id);
  }

  /**
   * 清除特定模组的数据
   */
  clearModData(modId) {
    for (const [type, typeMap] of this.data) {
      for (const [id, item] of typeMap) {
        if (item._mod === modId) {
          typeMap.delete(id);
        }
      }
    }
  }

  /**
   * 导出数据
   */
  exportData(type) {
    if (!this.data.has(type)) return null;

    return Array.from(this.data.get(type).values());
  }

  /**
   * 导入数据
   */
  importData(type, items, modId = 'custom') {
    if (!this.data.has(type)) {
      console.warn(`Unknown data type: ${type}`);
      return false;
    }

    if (!Array.isArray(items)) {
      items = [items];
    }

    for (const item of items) {
      this.addItem(type, item.id, item, modId);
    }

    return true;
  }

  /**
   * 获取数据统计
   */
  getStats() {
    const stats = {};

    for (const [type, typeMap] of this.data) {
      stats[type] = typeMap.size;
    }

    return stats;
  }
}

// 导出单例
export default new DataManager();
