/**
 * Event Bus
 * 事件总线系统，用于模组间通信
 */

class EventBus {
  constructor() {
    this.events = new Map(); // event -> [callbacks]
  }

  /**
   * 注册事件监听器
   */
  on(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    listeners.push({ callback, priority, once: false });

    // 按优先级排序
    listeners.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 注册一次性事件监听器
   */
  once(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    listeners.push({ callback, priority, once: true });

    listeners.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const index = listeners.findIndex(l => l.callback === callback);

    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  async emit(event, data = {}) {
    if (!this.events.has(event)) return [];

    const listeners = this.events.get(event);
    const results = [];

    // 复制数组，避免在回调中修改原始数组
    const listenersCopy = [...listeners];

    for (const listener of listenersCopy) {
      try {
        const result = await listener.callback(data);
        results.push(result);

        // 移除一次性监听器
        if (listener.once) {
          const index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }

    return results;
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events.clear();
  }

  /**
   * 清除特定事件的所有监听器
   */
  clearEvent(event) {
    this.events.delete(event);
  }

  /**
   * 获取事件的监听器数量
   */
  listenerCount(event) {
    if (!this.events.has(event)) return 0;
    return this.events.get(event).length;
  }

  /**
   * 列出所有已注册的事件
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
}

// 导出单例
export default new EventBus();
