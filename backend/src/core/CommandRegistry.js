/**
 * Command Registry
 * 命令注册系统，允许模组添加自定义命令
 */

class CommandRegistry {
  constructor() {
    this.commands = new Map(); // commandName -> command definition
    this.aliases = new Map();   // alias -> commandName

    // 注册内置命令
    this.registerBuiltinCommands();
  }

  /**
   * 注册内置命令
   */
  registerBuiltinCommands() {
    // /roll 命令
    this.register({
      name: 'roll',
      description: 'Roll dice',
      usage: '/roll <notation> [advantage|disadvantage]',
      handler: async (args, context) => {
        const { DiceRoller } = await import('../utils/dice.js');
        // 实现掷骰逻辑
        return { result: 'roll result' };
      }
    });

    // /help 命令
    this.register({
      name: 'help',
      description: 'Show available commands',
      usage: '/help [command]',
      handler: async (args, context) => {
        if (args[0]) {
          const command = this.getCommand(args[0]);
          if (command) {
            return {
              name: command.name,
              description: command.description,
              usage: command.usage
            };
          }
          return { error: 'Command not found' };
        }

        // 列出所有命令
        return {
          commands: Array.from(this.commands.values()).map(cmd => ({
            name: cmd.name,
            description: cmd.description
          }))
        };
      }
    });
  }

  /**
   * 注册命令
   */
  register(command) {
    if (!command.name || typeof command.handler !== 'function') {
      throw new Error('Invalid command: must have name and handler');
    }

    this.commands.set(command.name, {
      ...command,
      enabled: true
    });

    // 注册别名
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.name);
      }
    }

    console.log(`Registered command: ${command.name}`);
  }

  /**
   * 注销命令
   */
  unregister(name) {
    const command = this.commands.get(name);

    if (command && command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.delete(alias);
      }
    }

    return this.commands.delete(name);
  }

  /**
   * 执行命令
   */
  async execute(name, args, context) {
    const command = this.getCommand(name);

    if (!command) {
      return { error: 'Command not found' };
    }

    if (!command.enabled) {
      return { error: 'Command is disabled' };
    }

    try {
      return await command.handler(args, context);
    } catch (error) {
      console.error(`Error executing command ${name}:`, error);
      return { error: error.message };
    }
  }

  /**
   * 获取命令
   */
  getCommand(name) {
    // 检查是否是别名
    const realName = this.aliases.get(name) || name;
    return this.commands.get(realName);
  }

  /**
   * 列出所有命令
   */
  listCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * 启用/禁用命令
   */
  setCommandEnabled(name, enabled) {
    const command = this.commands.get(name);
    if (command) {
      command.enabled = enabled;
      return true;
    }
    return false;
  }
}

// 导出单例
export default new CommandRegistry();
