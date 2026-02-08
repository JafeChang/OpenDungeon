# 🎮 AI-Dungeon-Master 测试指南

## 服务状态

✅ **后端服务器**: 运行在 http://localhost:3001
✅ **前端服务器**: 运行在 http://localhost:5173

## 访问地址

### 前端应用
```
http://localhost:5173
```

### 后端 API
```
http://localhost:3001/api/health
http://localhost:3001/api/mods
http://localhost:3001/api/cards/decks
```

## 🎯 可测试功能

### 1. 主厅 (Lobby)
访问: http://localhost:5173
- 创建游戏房间
- 配置 AI 设置
- 进入其他功能页面

### 2. 模组管理器
访问: http://localhost:5173/mods
- 查看已安装模组
- 启用/禁用模组
- 切换语言
- 切换规则集

### 3. 卡组管理器
访问: http://localhost:5173/decks
- 查看预构建卡组
- 搜索卡片（物品、法术、怪物）
- 抽卡功能

### 4. 地下城生成器
访问: http://localhost:5173/dungeon
- 配置地下城参数
- 生成地下城
- 2D 地图可视化
- 查看房间详情

### 5. 游戏房间
访问: http://localhost:5173/game/[房间ID]
- 实时聊天
- Socket.io 连接
- 骰子投掷

## 🧪 API 测试命令

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取模组列表
curl http://localhost:3001/api/mods

# 获取卡组
curl http://localhost:3001/api/cards/decks

# 生成地下城
curl -X POST http://localhost:3001/api/dungeons/generate \
  -H "Content-Type: application/json" \
  -d '{"name":"测试地城","level":1,"floors":2}'

# 搜索卡片
curl "http://localhost:3001/api/cards/search?type=items&q=sword"
```

## ⚠️ 已知限制（演示模式）

1. **数据库已禁用** - 使用内存存储，重启后数据丢失
2. **LLM 响应** - 使用模拟响应，需要配置真实的 API Key
3. **数据持久化** - 未启用 SQLite

## 📝 测试流程建议

1. 访问主页，查看大厅界面
2. 点击"模组管理"查看可用模组
3. 点击"卡组管理"查看预构建卡组
4. 点击"生成地下城"体验程序化生成
5. 创建房间并测试聊天功能

## 🔧 配置 LLM

在游戏设置页面或通过 API 配置：
- OpenAI: https://api.openai.com/v1
- DeepSeek: https://api.deepseek.com/v1
- Ollama: http://localhost:11434/v1

---

**Generated with [Claude Code](https://claude.ai/code)**
**via [Happy](https://happy.engineering)**
