/**
 * Dungeon Generator
 * 地下城生成器 - 程序化生成地下城和冒险区域
 */

import { v4 as uuidv4 } from 'uuid';
import DataManager from './DataManager.js';
import EventBus from './EventBus.js';

class DungeonGenerator {
  constructor() {
    this.roomTypes = new Map();
    this.corridorTypes = new Map();
    this.dungeonThemes = new Map();

    // 注册内置房间类型
    this.registerBuiltinRoomTypes();
  }

  /**
   * 注册内置房间类型
   */
  registerBuiltinRoomTypes() {
    // 战斗房间
    this.registerRoomType('combat', {
      name: 'Combat Room',
      weight: 40,
      minSize: { width: 3, height: 3 },
      maxSize: { width: 8, height: 8 },
      features: ['cover', 'obstacles', 'traps'],
      generate: (room) => this.generateCombatRoom(room)
    });

    // 宝藏房间
    this.registerRoomType('treasure', {
      name: 'Treasure Room',
      weight: 15,
      minSize: { width: 2, height: 2 },
      maxSize: { width: 5, height: 5 },
      features: ['chest', 'loot', 'traps'],
      generate: (room) => this.generateTreasureRoom(room)
    });

    // 谜题房间
    this.registerRoomType('puzzle', {
      name: 'Puzzle Room',
      weight: 10,
      minSize: { width: 3, height: 3 },
      maxSize: { width: 6, height: 6 },
      features: ['mechanism', 'clues', 'traps'],
      generate: (room) => this.generatePuzzleRoom(room)
    });

    // 休息房间
    this.registerRoomType('rest', {
      name: 'Rest Area',
      weight: 10,
      minSize: { width: 2, height: 2 },
      maxSize: { width: 4, height: 4 },
      features: ['fountain', 'benches', 'healing'],
      generate: (room) => this.generateRestRoom(room)
    });

    // 特殊房间
    this.registerRoomType('special', {
      name: 'Special Room',
      weight: 10,
      minSize: { width: 3, height: 3 },
      maxSize: { width: 6, height: 6 },
      features: ['unique', 'story', 'boss'],
      generate: (room) => this.generateSpecialRoom(room)
    });

    // 走廊
    this.registerCorridorType('straight', {
      name: 'Straight Corridor',
      weight: 50
    });

    this.registerCorridorType('L_shaped', {
      name: 'L-Shaped Corridor',
      weight: 30
    });

    this.registerCorridorType('T_shaped', {
      name: 'T-Shaped Corridor',
      weight: 15
    });

    this.registerCorridorType('cross', {
      name: 'Cross Corridor',
      weight: 5
    });
  }

  /**
   * 注册房间类型
   */
  registerRoomType(type, definition) {
    this.roomTypes.set(type, definition);
  }

  /**
   * 注册走廊类型
   */
  registerCorridorType(type, definition) {
    this.corridorTypes.set(type, definition);
  }

  /**
   * 注册地下城主题
   */
  registerDungeonTheme(themeId, theme) {
    this.dungeonThemes.set(themeId, theme);
  }

  /**
   * 生成地下城
   */
  generateDungeon(options = {}) {
    const {
      name = 'Generated Dungeon',
      level = 1,
      floors = 1,
      roomsPerFloor = 10,
      theme = 'generic',
      size = 'medium'
    } = options;

    const dungeon = {
      id: uuidv4(),
      name,
      level,
      theme,
      floors: [],
      createdAt: new Date().toISOString()
    };

    // 生成每层
    for (let i = 0; i < floors; i++) {
      const floor = this.generateFloor({
        floorNumber: i + 1,
        rooms: roomsPerFloor,
        level: level + i,
        theme,
        size
      });

      dungeon.floors.push(floor);
    }

    // 触发事件
    EventBus.emit('dungeon_generated', dungeon);

    return dungeon;
  }

  /**
   * 生成楼层
   */
  generateFloor(options) {
    const { floorNumber, rooms, level, theme, size } = options;

    const floor = {
      id: uuidv4(),
      floorNumber,
      level,
      theme,
      rooms: [],
      corridors: [],
      entrances: [],
      exits: [],
      description: this.generateFloorDescription(theme, floorNumber)
    };

    // 生成房间网格
    const gridSize = this.getGridSize(size);
    const grid = this.createGrid(gridSize.width, gridSize.height);

    // 放置房间
    const placedRooms = this.placeRooms(grid, rooms, level);

    // 连接房间
    this.connectRooms(placedRooms, floor);

    // 设置入口和出口
    this.setEntrancesAndExits(floor, placedRooms);

    floor.rooms = placedRooms;

    return floor;
  }

  /**
   * 获取网格大小
   */
  getGridSize(size) {
    const sizes = {
      small: { width: 10, height: 10 },
      medium: { width: 15, height: 15 },
      large: { width: 20, height: 20 },
      huge: { width: 30, height: 30 }
    };
    return sizes[size] || sizes.medium;
  }

  /**
   * 创建网格
   */
  createGrid(width, height) {
    return Array(height).fill(null).map(() => Array(width).fill(null));
  }

  /**
   * 放置房间
   */
  placeRooms(grid, count, level) {
    const rooms = [];
    const roomTypes = Array.from(this.roomTypes.keys());

    for (let i = 0; i < count; i++) {
      // 选择房间类型（加权随机）
      const roomType = this.selectWeightedRoomType(roomTypes);

      // 生成房间尺寸
      const typeDef = this.roomTypes.get(roomType);
      const width = this.randomInRange(typeDef.minSize.width, typeDef.maxSize.width);
      const height = this.randomInRange(typeDef.minSize.height, typeDef.maxSize.height);

      // 尝试放置房间
      const position = this.findRoomPosition(grid, width, height);

      if (position) {
        const room = {
          id: uuidv4(),
          type: roomType,
          x: position.x,
          y: position.y,
          width,
          height,
          level,
          contents: this.generateRoomContents(roomType, level),
          features: this.generateRoomFeatures(roomType),
          description: this.generateRoomDescription(roomType),
          connections: []
        };

        // 标记网格
        this.markGrid(grid, room);

        // 应用房间生成器
        if (typeDef.generate) {
          typeDef.generate(room);
        }

        rooms.push(room);
      }
    }

    return rooms;
  }

  /**
   * 选择加权房间类型
   */
  selectWeightedRoomType(roomTypes) {
    const weights = roomTypes.map(type => this.roomTypes.get(type).weight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let random = Math.random() * totalWeight;

    for (let i = 0; i < roomTypes.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return roomTypes[i];
      }
    }

    return roomTypes[0];
  }

  /**
   * 查找房间位置
   */
  findRoomPosition(grid, width, height) {
    const maxAttempts = 100;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = Math.floor(Math.random() * (grid[0].length - width - 2)) + 1;
      const y = Math.floor(Math.random() * (grid.length - height - 2)) + 1;

      if (this.canPlaceRoom(grid, x, y, width, height)) {
        return { x, y };
      }
    }

    return null;
  }

  /**
   * 检查是否可以放置房间
   */
  canPlaceRoom(grid, x, y, width, height) {
    // 检查边界
    if (x + width >= grid[0].length || y + height >= grid.length) {
      return false;
    }

    // 检查重叠（保留1格间距）
    for (let dy = -1; dy <= height; dy++) {
      for (let dx = -1; dx <= width; dx++) {
        const checkX = x + dx;
        const checkY = y + dy;

        if (checkY >= 0 && checkY < grid.length &&
            checkX >= 0 && checkX < grid[0].length) {
          if (grid[checkY][checkX] !== null) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * 标记网格
   */
  markGrid(grid, room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        grid[y][x] = room.id;
      }
    }
  }

  /**
   * 连接房间
   */
  connectRooms(rooms, floor) {
    // 使用最小生成树算法连接房间
    const connected = new Set([rooms[0].id]);
    const unconnected = new Set(rooms.slice(1).map(r => r.id));

    while (unconnected.size > 0) {
      // 找到最近的连接房间对
      let minDist = Infinity;
      let connection = null;

      for (const connectedId of connected) {
        const connectedRoom = rooms.find(r => r.id === connectedId);

        for (const unconnectedId of unconnected) {
          const unconnectedRoom = rooms.find(r => r.id === unconnectedId);

          const dist = this.calculateDistance(connectedRoom, unconnectedRoom);

          if (dist < minDist) {
            minDist = dist;
            connection = {
              from: connectedRoom,
              to: unconnectedRoom
            };
          }
        }
      }

      if (connection) {
        // 创建走廊
        const corridor = this.createCorridor(connection.from, connection.to);

        if (corridor) {
          floor.corridors.push(corridor);

          // 更新房间连接
          connection.from.connections.push({
            to: connection.to.id,
            via: corridor.id
          });
          connection.to.connections.push({
            to: connection.from.id,
            via: corridor.id
          });
        }

        connected.add(connection.to.id);
        unconnected.delete(connection.to.id);
      }
    }
  }

  /**
   * 计算房间距离
   */
  calculateDistance(room1, room2) {
    const x1 = Math.floor(room1.x + room1.width / 2);
    const y1 = Math.floor(room1.y + room1.height / 2);
    const x2 = Math.floor(room2.x + room2.width / 2);
    const y2 = Math.floor(room2.y + room2.height / 2);

    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  /**
   * 创建走廊
   */
  createCorridor(room1, room2) {
    const x1 = Math.floor(room1.x + room1.width / 2);
    const y1 = Math.floor(room1.y + room1.height / 2);
    const x2 = Math.floor(room2.x + room2.width / 2);
    const y2 = Math.floor(room2.y + room2.height / 2);

    const corridor = {
      id: uuidv4(),
      type: this.selectCorridorType(x1, y1, x2, y2),
      from: { x: x1, y: y1, room: room1.id },
      to: { x: x2, y: y2, room: room2.id },
      path: this.generateCorridorPath(x1, y1, x2, y2),
      features: this.generateCorridorFeatures()
    };

    return corridor;
  }

  /**
   * 选择走廊类型
   */
  selectCorridorType(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    if (dx === 0 || dy === 0) return 'straight';
    if (Math.random() < 0.3) return 'cross';

    return Math.random() < 0.5 ? 'L_shaped' : 'T_shaped';
  }

  /**
   * 生成走廊路径
   */
  generateCorridorPath(x1, y1, x2, y2) {
    const path = [{ x: x1, y: y1 }];

    let currentX = x1;
    let currentY = y1;

    // 先水平移动，再垂直移动
    while (currentX !== x2) {
      currentX += currentX < x2 ? 1 : -1;
      path.push({ x: currentX, y: currentY });
    }

    while (currentY !== y2) {
      currentY += currentY < y2 ? 1 : -1;
      path.push({ x: currentX, y: currentY });
    }

    return path;
  }

  /**
   * 设置入口和出口
   */
  setEntrancesAndExits(floor, rooms) {
    // 入口通常是第一个房间
    floor.entrances.push({
      type: 'stairs_down',
      roomId: rooms[0].id,
      description: 'A staircase leading down into the dungeon'
    });

    // 出口通常是最后一个房间
    floor.exits.push({
      type: 'stairs_up',
      roomId: rooms[rooms.length - 1].id,
      description: 'A staircase leading up to the surface'
    });
  }

  /**
   * 生成房间内容
   */
  generateRoomContents(roomType, level) {
    const contents = [];

    if (roomType === 'combat') {
      // 生成怪物
      const monsters = this.generateMonstersForRoom(level);
      contents.push(...monsters);
    } else if (roomType === 'treasure') {
      // 生成宝物
      const treasure = this.generateTreasure(level);
      contents.push(treasure);
    } else if (roomType === 'puzzle') {
      // 生成谜题
      contents.push({
        type: 'puzzle',
        difficulty: level,
        description: 'A complex mechanism blocks your path'
      });
    }

    return contents;
  }

  /**
   * 生成房间特征
   */
  generateRoomFeatures(roomType) {
    const typeDef = this.roomTypes.get(roomType);
    const features = typeDef.features || [];

    return features.filter(() => Math.random() < 0.5);
  }

  /**
   * 生成房间描述
   */
  generateRoomDescription(roomType) {
    const descriptions = {
      combat: [
        'The air smells of dampness and decay',
        'Weapons and armor litter the floor',
        'Scratches cover the walls'
      ],
      treasure: [
        'Golden coins sparkle in the dim light',
        'A chest sits in the center of the room',
        'Precious items are scattered about'
      ],
      puzzle: [
        'Ancient runes cover the walls',
        'A mysterious device hums with energy',
        'Strange symbols glow faintly'
      ],
      rest: [
        'A peaceful sanctuary',
        'The sound of trickling water echoes',
        'Soft light fills the room'
      ],
      special: [
        'An otherworldly presence fills the air',
        'Ancient magic permeates the chamber',
        'Something powerful resides here'
      ]
    };

    const typeDescriptions = descriptions[roomType] || [];
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  }

  /**
   * 生成楼层描述
   */
  generateFloorDescription(theme, floorNumber) {
    return `Floor ${floorNumber} of the ${theme} dungeon`;
  }

  /**
   * 为房间生成怪物
   */
  generateMonstersForRoom(level) {
    const monsters = DataManager.getAllItems('monsters');
    const appropriateMonsters = monsters.filter(m => m.cr <= level);

    const count = Math.floor(Math.random() * 3) + 1;
    const selectedMonsters = [];

    for (let i = 0; i < count; i++) {
      if (appropriateMonsters.length > 0) {
        const monster = appropriateMonsters[
          Math.floor(Math.random() * appropriateMonsters.length)
        ];
        selectedMonsters.push({
          type: 'monster',
          id: monster.id,
          name: monster.name,
          hp: this.calculateMonsterHP(monster),
          description: monster.description
        });
      }
    }

    return selectedMonsters;
  }

  /**
   * 计算怪物 HP
   */
  calculateMonsterHP(monster) {
    const match = monster.hp.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return monster.hp;

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;

    let total = modifier;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }

    return total;
  }

  /**
   * 生成宝藏
   */
  generateTreasure(level) {
    const treasure = {
      type: 'treasure',
      gold: Math.floor(Math.random() * level * 100) + 50,
      items: []
    };

    // 随机添加物品
    const items = DataManager.getAllItems('items');
    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numItems; i++) {
      const item = items[Math.floor(Math.random() * items.length)];
      treasure.items.push({
        id: item.id,
        name: item.name,
        description: item.description
      });
    }

    return treasure;
  }

  /**
   * 生成走廊特征
   */
  generateCorridorFeatures() {
    const features = ['torches', 'debris', 'bones', 'traps'];
    return features.filter(() => Math.random() < 0.3);
  }

  /**
   * 生成战斗房间
   */
  generateCombatRoom(room) {
    room.ambience = 'tense';
    room.lighting = 'dim';
  }

  /**
   * 生成宝藏房间
   */
  generateTreasureRoom(room) {
    room.ambience = 'mysterious';
    room.lighting = 'faint_glow';
  }

  /**
   * 生成谜题房间
   */
  generatePuzzleRoom(room) {
    room.ambience = 'ancient';
    room.lighting = 'magical';
  }

  /**
   * 生成休息房间
   */
  generateRestRoom(room) {
    room.ambience = 'peaceful';
    room.lighting = 'warm';
  }

  /**
   * 生成特殊房间
   */
  generateSpecialRoom(room) {
    room.ambience = 'powerful';
    room.lighting = 'dramatic';
  }

  /**
   * 随机范围
   */
  randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 导出地下城
   */
  exportDungeon(dungeon) {
    return JSON.stringify(dungeon, null, 2);
  }

  /**
   * 导入地下城
   */
  importDungeon(dungeonData) {
    try {
      return JSON.parse(dungeonData);
    } catch (error) {
      console.error('Failed to import dungeon:', error);
      return null;
    }
  }
}

// 导出单例
export default new DungeonGenerator();
