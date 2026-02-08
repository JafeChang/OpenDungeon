/**
 * Mod Loader System
 * 动态加载和管理游戏模组
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ModLoader {
  constructor() {
    this.mods = new Map(); // modId -> mod metadata
    this.modDirectories = [
      path.join(__dirname, '../../mods/core'),      // 核心模组
      path.join(__dirname, '../../mods/custom'),    // 自定义模组
      path.join(process.env.MOD_PATH || '', '')     // 用户指定路径
    ].filter(dir => dir && fs.existsSync(dir));
  }

  /**
   * 初始化模组加载器
   */
  async initialize() {
    console.log('Initializing Mod Loader...');
    await this.discoverMods();
    await this.loadMods();
    console.log(`Loaded ${this.mods.size} mods`);
  }

  /**
   * 发现所有可用模组
   */
  async discoverMods() {
    for (const dir of this.modDirectories) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const modPath = path.join(dir, entry.name);
            const manifestPath = path.join(modPath, 'manifest.json');

            if (fs.existsSync(manifestPath)) {
              await this.registerMod(manifestPath, modPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${dir}:`, error.message);
      }
    }
  }

  /**
   * 注册模组
   */
  async registerMod(manifestPath, modPath) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

      // 验证模组清单
      if (!this.validateManifest(manifest)) {
        console.warn(`Invalid manifest: ${manifestPath}`);
        return;
      }

      // 检查依赖
      if (manifest.dependencies && manifest.dependencies.length > 0) {
        const missingDeps = manifest.dependencies.filter(
          dep => !this.isModAvailable(dep)
        );
        if (missingDeps.length > 0) {
          console.warn(`Mod ${manifest.id} missing dependencies: ${missingDeps.join(', ')}`);
          return;
        }
      }

      this.mods.set(manifest.id, {
        ...manifest,
        path: modPath,
        loaded: false,
        enabled: manifest.enabled !== false // 默认启用
      });

      console.log(`Registered mod: ${manifest.id} v${manifest.version}`);
    } catch (error) {
      console.error(`Failed to register mod from ${manifestPath}:`, error);
    }
  }

  /**
   * 验证模组清单
   */
  validateManifest(manifest) {
    const required = ['id', 'name', 'version', 'type'];
    return required.every(field => field in manifest);
  }

  /**
   * 检查模组是否可用
   */
  isModAvailable(modId) {
    return this.mods.has(modId);
  }

  /**
   * 加载所有启用的模组
   */
  async loadMods() {
    for (const [modId, mod] of this.mods) {
      if (mod.enabled && !mod.loaded) {
        await this.loadMod(modId);
      }
    }
  }

  /**
   * 加载单个模组
   */
  async loadMod(modId) {
    const mod = this.mods.get(modId);
    if (!mod || mod.loaded) return;

    try {
      console.log(`Loading mod: ${modId}`);

      // 加载模组的主文件
      const mainPath = path.join(mod.path, mod.main || 'index.js');

      if (fs.existsSync(mainPath)) {
        const modModule = await import(mainPath);
        if (modModule.activate) {
          const api = await this.getModAPI();
          await modModule.activate(api);
        }
      }

      // 加载语言文件
      if (mod.type === 'i18n') {
        await this.loadI18nMod(mod);
      }

      // 加载数据包
      if (mod.type === 'datapack') {
        await this.loadDatapack(mod);
      }

      // 加载规则集
      if (mod.type === 'ruleset') {
        await this.loadRuleset(mod);
      }

      mod.loaded = true;
      console.log(`Successfully loaded mod: ${modId}`);
    } catch (error) {
      console.error(`Failed to load mod ${modId}:`, error);
    }
  }

  /**
   * 卸载模组
   */
  async unloadMod(modId) {
    const mod = this.mods.get(modId);
    if (!mod || !mod.loaded) return;

    try {
      const mainPath = path.join(mod.path, mod.main || 'index.js');

      if (fs.existsSync(mainPath)) {
        const modModule = await import(mainPath);
        if (modModule.deactivate) {
          await modModule.deactivate();
        }
      }

      mod.loaded = false;
      console.log(`Unloaded mod: ${modId}`);
    } catch (error) {
      console.error(`Failed to unload mod ${modId}:`, error);
    }
  }

  /**
   * 加载国际化模组
   */
  async loadI18nMod(mod) {
    const i18n = (await import('./I18nManager.js')).default;
    const localesPath = path.join(mod.path, 'locales');

    if (fs.existsSync(localesPath)) {
      const locales = fs.readdirSync(localesPath);

      for (const localeFile of locales) {
        const locale = localeFile.replace('.json', '');
        const translations = JSON.parse(
          fs.readFileSync(path.join(localesPath, localeFile), 'utf-8')
        );

        i18n.addTranslations(locale, translations);
      }
    }
  }

  /**
   * 加载数据包
   */
  async loadDatapack(mod) {
    const DataManager = (await import('./DataManager.js')).default;

    const dataPath = path.join(mod.path, 'data');

    if (fs.existsSync(dataPath)) {
      await DataManager.loadFromDirectory(dataPath, mod.id);
    }
  }

  /**
   * 加载规则集
   */
  async loadRuleset(mod) {
    const RuleEngine = (await import('./RuleEngine.js')).default;

    const rulesPath = path.join(mod.path, 'rules.json');

    if (fs.existsSync(rulesPath)) {
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      RuleEngine.registerRuleset(mod.id, rules);
    }
  }

  /**
   * 获取模组 API
   * 提供给模组使用的接口
   */
  async getModAPI() {
    // 动态导入所有依赖
    const CommandRegistry = (await import('./CommandRegistry.js')).default;
    const EventBus = (await import('./EventBus.js')).default;
    const DataManager = (await import('./DataManager.js')).default;
    const I18nManager = (await import('./I18nManager.js')).default;
    const RuleEngine = (await import('./RuleEngine.js')).default;

    return {
      // 注册命令
      registerCommand: (name, handler) => {
        CommandRegistry.register(name, handler);
      },

      // 注册钩子
      registerHook: (event, callback) => {
        EventBus.on(event, callback);
      },

      // 访问数据管理器
      data: DataManager,

      // 访问国际化管理器
      i18n: I18nManager,

      // 访问规则引擎
      rules: RuleEngine,

      // 获取模组信息
      getMod: (modId) => this.mods.get(modId),

      // 列出所有模组
      listMods: () => Array.from(this.mods.values())
    };
  }

  /**
   * 获取模组信息
   */
  getMod(modId) {
    return this.mods.get(modId);
  }

  /**
   * 列出所有模组
   */
  listMods() {
    return Array.from(this.mods.values());
  }

  /**
   * 启用/禁用模组
   */
  setModEnabled(modId, enabled) {
    const mod = this.mods.get(modId);
    if (mod) {
      mod.enabled = enabled;
      if (enabled && !mod.loaded) {
        this.loadMod(modId);
      } else if (!enabled && mod.loaded) {
        this.unloadMod(modId);
      }
    }
  }
}

// 导出单例
export default new ModLoader();
