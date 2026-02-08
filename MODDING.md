# AI Dungeon Master - 模组开发指南

本指南将帮助您创建自定义模组来扩展 AI Dungeon Master 的功能。

## 目录

1. [模组类型](#模组类型)
2. [模组结构](#模组结构)
3. [创建数据包模组](#创建数据包模组)
4. [创建语言包模组](#创建语言包模组)
5. [创建规则集模组](#创建规则集模组)
6. [高级：创建功能模组](#高级创建功能模组)
7. [模组 API](#模组-api)
8. [最佳实践](#最佳实践)

---

## 模组类型

AI Dungeon Master 支持以下类型的模组：

| 类型 | 描述 | 示例 |
|------|------|------|
| **datapack** | 添加游戏数据（怪物、物品、法术等） | 怪物图鉴扩展 |
| **i18n** | 添加新语言的翻译 | 日语语言包 |
| **ruleset** | 添加新的规则系统 | Pathfinder 2e |
| **custom** | 自定义功能模组 | 战斗追踪器 |

---

## 模组结构

基本模组结构：

```
my-mod/
├── manifest.json       # 模组清单（必需）
├── index.js           # 主文件（功能模组）
├── data/              # 数据文件（数据包）
│   ├── monsters/
│   ├── items/
│   └── spells/
├── locales/           # 翻译文件（语言包）
│   ├── en-US.json
│   └── ja-JP.json
└── rules.json         # 规则定义（规则集）
```

### manifest.json

每个模组必须有 `manifest.json`：

```json
{
  "id": "my-mod",
  "name": "My Custom Mod",
  "version": "1.0.0",
  "description": "A brief description",
  "author": "Your Name",
  "type": "datapack",
  "dependencies": [],
  "enabled": true,
  "main": "index.js"
}
```

| 字段 | 必需 | 描述 |
|------|------|------|
| id | ✅ | 唯一标识符（小写字母、数字、连字符） |
| name | ✅ | 模组显示名称 |
| version | ✅ | 版本号（语义化版本） |
| description | ✅ | 简短描述 |
| author | - | 作者名称 |
| type | ✅ | 模组类型 |
| dependencies | - | 依赖的模组 ID 列表 |
| enabled | - | 是否默认启用（默认 true） |
| main | - | 功能模组的主文件路径 |

---

## 创建数据包模组

数据包模组添加游戏数据，如怪物、物品、法术等。

### 示例：添加新怪物

创建 `backend/mods/custom/my-monsters/manifest.json`：

```json
{
  "id": "my-monsters",
  "name": "Custom Monsters",
  "version": "1.0.0",
  "description": "Adds custom monsters to the game",
  "type": "datapack"
}
```

创建 `backend/mods/custom/my-monsters/data/monsters/dragon.json`：

```json
[
  {
    "id": "monster_shadow_dragon",
    "name": "Shadow Dragon",
    "cr": 10,
    "hp": "15d10 + 60",
    "ac": 19,
    "speed": "40 ft., fly 80 ft.",
    "stats": {
      "STR": 23,
      "DEX": 10,
      "CON": 21,
      "INT": 14,
      "WIS": 15,
      "CHA": 17
    },
    "skills": {
      "stealth": 8,
      "perception": 7
    },
    "senses": "blindsight 60 ft., darkvision 120 ft., passive Perception 17",
    "languages": "Common, Draconic",
    "challenge": "10 (5,900 XP)",
    "traits": [
      {
        "name": "Shadow Stealth",
        "description": "While in dim light or darkness, the dragon can take the Hide action as a bonus action."
      }
    ],
    "actions": [
      {
        "name": "Multiattack",
        "description": "The dragon makes three attacks: one with its bite and two with its claws."
      },
      {
        "name": "Bite",
        "type": "weapon",
        "attack": "+10 to hit, reach 10 ft., one target",
        "hit": "17 (2d10 + 6) piercing damage plus 3 (1d6) necrotic damage"
      }
    ]
  }
]
```

### 支持的数据类型

| 类型 | 目录 | 文件示例 |
|------|------|----------|
| 怪物 | `data/monsters/` | `goblin.json` |
| 物品 | `data/items/` | `sword.json` |
| 法术 | `data/spells/` | `fireball.json` |
| 职业 | `data/classes/` | `fighter.json` |
| 种族 | `data/races/` | `elf.json` |
| 背景 | `data/backgrounds/` | `soldier.json` |

---

## 创建语言包模组

语言包模组添加新语言的翻译。

### 示例：添加德语翻译

创建 `backend/mods/custom/i18n-de/manifest.json`：

```json
{
  "id": "i18n-de",
  "name": "German Language Pack",
  "version": "1.0.0",
  "description": "German translations for the UI",
  "author": "Your Name",
  "type": "i18n"
}
```

创建 `backend/mods/custom/i18n-de/locales/de-DE.json`：

```json
{
  "app.name": "AI Dungeon Meister",
  "app.subtitle": "D&D 5e TTRPG-Plattform",

  "ui.create_room": "Raum erstellen",
  "ui.join_room": "Raum beitreten",
  "ui.settings": "Einstellungen",
  "ui.send": "Senden",
  "ui.leave": "Verlassen",

  "game.dm": "DM",
  "game.player": "Spieler",
  "game.roll": "Würfeln",
  "game.advantage": "Vorteil",
  "game.disadvantage": "Nachteil",

  "stat.strength": "Stärke",
  "stat.dexterity": "Geschicklichkeit",
  "stat.constitution": "Konstitution",
  "stat.intelligence": "Intelligenz",
  "stat.wisdom": "Weisheit",
  "stat.charisma": "Charisma"
}
```

---

## 创建规则集模组

规则集模组添加新的游戏规则系统。

### 示例：Pathfinder 2e 规则集

创建 `backend/mods/custom/pf2e/manifest.json`：

```json
{
  "id": "pf2e",
  "name": "Pathfinder 2e",
  "version": "1.0.0",
  "description": "Pathfinder Second Edition rules",
  "type": "ruleset"
}
```

创建 `backend/mods/custom/pf2e/rules.json`：

```json
{
  "name": "Pathfinder 2e",
  "version": "1.0",
  "description": "Pathfinder Second Edition rules",

  "abilities": ["STR", "DEX", "CON", "INT", "WIS", "CHA"],

  "skills": [
    "acrobatics", "arcana", "athletics", "crafting",
    "deception", "diplomacy", "intimidation", "medicine",
    "nature", "occultism", "performance", "religion",
    "society", "stealth", "survival", "thievery"
  ],

  "getProficiencyBonus": "(level) => level + 2",

  "defaultCharacter": {
    "level": 1,
    "hp": { "current": 0, "max": 0 },
    "stats": { "STR": 10, "DEX": 10, "CON": 10, "INT": 10, "WIS": 10, "CHA": 10 },
    "actions": 3
  }
}
```

---

## 高级：创建功能模组

功能模组使用 JavaScript 添加自定义功能。

### 示例：自定义命令

创建 `backend/mods/custom/my-commands/manifest.json`：

```json
{
  "id": "my-commands",
  "name": "Custom Commands",
  "version": "1.0.0",
  "description": "Adds custom chat commands",
  "type": "custom",
  "main": "index.js"
}
```

创建 `backend/mods/custom/my-commands/index.js`：

```javascript
/**
 * 模组激活时调用
 * @param {object} api - Mod API
 */
export async function activate(api) {
  // 注册自定义命令
  api.registerCommand('rollstats', async (args, context) => {
    // 生成随机属性
    const stats = {};
    const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

    for (const ability of abilities) {
      const rolls = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      rolls.sort((a, b) => b - a);
      const total = rolls[0] + rolls[1] + rolls[2];
      stats[ability] = { rolls, total };
    }

    return {
      message: 'Rolled stats:',
      stats
    };
  });

  // 注册事件监听器
  api.registerHook('player_action', async (data) => {
    console.log('Player acted:', data.action);

    // 可以修改数据或添加副作用
    return data;
  });

  console.log('Custom Commands mod activated!');
}

/**
 * 模组停用时调用
 */
export async function deactivate() {
  console.log('Custom Commands mod deactivated!');
}
```

---

## 模组 API

功能模组可以访问以下 API：

### 数据操作

```javascript
// 获取数据项
const goblin = api.data.getItem('monsters', 'monster_goblin');

// 搜索数据
const swords = api.data.search('items', 'sword');

// 添加新数据
api.data.addItem('monsters', 'my_monster', {
  id: 'my_monster',
  name: 'My Monster',
  cr: 5
}, 'my-mod');
```

### 国际化

```javascript
// 翻译文本
const translated = api.i18n.t('ui.create_room');

// 添加翻译
api.i18n.addTranslations('de-DE', {
  'ui.my_text': 'Mein Text'
});
```

### 规则引擎

```javascript
// 获取当前规则集
const ruleset = api.rules.getCurrentRuleset();

// 应用规则
const modifier = api.rules.applyRule('calculateModifier', 16);

// 创建角色
const character = api.rules.createCharacter({
  name: 'Hero',
  class: 'Fighter'
});
```

### 事件系统

```javascript
// 注册事件监听器
api.registerHook('player_action', async (data) => {
  // 处理事件
  return modifiedData;
});

// 可用事件：
// - player_action: 玩家行动时
// - dm_response: AI DM 响应时
// - character_created: 创建角色时
// - combat_start: 战斗开始时
```

### 命令系统

```javascript
// 注册命令
api.registerCommand('mycommand', async (args, context) => {
  // 处理命令
  return { message: 'Result' };
});
```

---

## 最佳实践

### 1. 命名规范

- 模组 ID: 使用小写字母、数字和连字符 (`my-awesome-mod`)
- 数据 ID: 使用前缀避免冲突 (`monster_my_dragon`, `spell_my_fireball`)

### 2. 版本控制

使用语义化版本：
- `1.0.0` - 初始版本
- `1.1.0` - 添加新功能
- `1.1.1` - Bug 修复
- `2.0.0` - 重大更改

### 3. 依赖管理

如果您的模组依赖其他模组：

```json
{
  "dependencies": [
    "dnd5e-core",
    "i18n-core"
  ]
}
```

### 4. 错误处理

在功能模组中处理错误：

```javascript
export async function activate(api) {
  try {
    // 您的代码
  } catch (error) {
    console.error('Mod activation failed:', error);
  }
}
```

### 5. 测试

在发布前测试您的模组：
1. 在开发环境中加载模组
2. 测试所有功能
3. 检查控制台是否有错误
4. 验证与其他模组的兼容性

---

## 模组发布

1. 将模组文件夹放入 `backend/mods/custom/`
2. 或创建 Git 仓库供他人克隆
3. 在模组说明中提供：
   - 功能描述
   - 安装说明
   - 依赖列表
   - 版本历史

---

## 故障排查

### 模组未加载

检查：
1. `manifest.json` 格式是否正确
2. 模组 ID 是否唯一
3. 依赖是否已安装
4. 查看服务器日志

### 数据未显示

检查：
1. JSON 文件格式是否正确
2. 数据 ID 是否唯一
3. 文件是否在正确的目录

### 翻译未生效

检查：
1. 语言代码是否正确（如 `de-DE`）
2. JSON 格式是否正确
3. 是否已重启服务器

---

## 示例模组

查看 `backend/mods/` 目录中的示例模组：
- `mods/core/dnd5e/` - D&D 5e 核心数据包
- `mods/core/i18n/` - 核心翻译
- `mods/custom/pathfinder2e/` - Pathfinder 2e 规则集

---

## 获取帮助

- GitHub Issues: https://github.com/your-repo/issues
- Discord: https://discord.gg/your-server
- 文档: https://docs.your-site.com

---

祝您模组开发愉快！ 🎲

---

Generated with [Claude Code](https://claude.ai/code)
via [Happy](https://happy.engineering)
