import axios from 'axios';

export interface NetworkTime {
  timestamp: number;
  offset: number;
  precision: number;
}

/**
 * 网络时间同步服务
 * 支持多个时间服务器，精确到毫秒
 */
export class TimeSync {
  private offset: number = 0;
  private lastSyncTime: number = 0;
  private syncInterval: number = 3600000; // 1小时同步一次

  // NTP 时间服务器列表
  private timeServers = [
    'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
    'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Shanghai',
  ];

  /**
   * 同步网络时间
   * 使用多个服务器请求取平均值提高精度
   */
  async syncTime(): Promise<NetworkTime> {
    const results: number[] = [];
    const startLocal = Date.now();

    try {
      // 并发请求多个时间服务器
      const promises = this.timeServers.map(async (server) => {
        try {
          const start = performance.now();
          const response = await axios.get(server, {
            timeout: 5000,
          });
          const end = performance.now();
          const rtt = end - start; // 往返时间

          let serverTime: number;

          // 解析不同服务器的响应格式
          if (response.data.unixtime) {
            // WorldTimeAPI 格式
            // datetime 格式: "2025-01-15T10:30:45.123456+08:00"
            serverTime = response.data.unixtime * 1000;
            if (response.data.datetime) {
              const match = response.data.datetime.match(/\.(\d{3})/);
              if (match) {
                serverTime += parseInt(match[1], 10);
              }
            }
          } else if (response.data.dateTime) {
            // TimeAPI 格式
            serverTime = new Date(response.data.dateTime).getTime();
          } else if (response.data.currentDateTime) {
            serverTime = new Date(response.data.currentDateTime).getTime();
          } else {
            throw new Error('Unknown time format');
          }

          // 补偿网络延迟（假设往返时间对称）
          return serverTime + rtt / 2;
        } catch (error) {
          console.warn(`Time server ${server} failed:`, error);
          return null;
        }
      });

      const responses = await Promise.allSettled(promises);

      responses.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          results.push(result.value);
        }
      });

      if (results.length === 0) {
        throw new Error('所有时间服务器请求失败');
      }

      // 计算平均服务器时间
      const avgServerTime = results.reduce((a, b) => a + b, 0) / results.length;
      const endLocal = Date.now();
      const localTime = (startLocal + endLocal) / 2;

      // 计算时间偏移
      this.offset = avgServerTime - localTime;
      this.lastSyncTime = Date.now();

      // 计算精度（标准差）
      const variance = results.reduce((sum, time) => {
        return sum + Math.pow(time - avgServerTime, 2);
      }, 0) / results.length;
      const precision = Math.sqrt(variance);

      console.log(`时间同步成功: 偏移 ${this.offset}ms, 精度 ±${precision.toFixed(2)}ms`);

      return {
        timestamp: avgServerTime,
        offset: this.offset,
        precision: precision,
      };
    } catch (error) {
      console.error('时间同步失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前精确时间（毫秒）
   */
  getCurrentTime(): number {
    return Date.now() + this.offset;
  }

  /**
   * 获取格式化的时间字符串
   */
  getFormattedTime(): {
    date: string;
    time: string;
    milliseconds: string;
  } {
    const now = this.getCurrentTime();
    const dateObj = new Date(now);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const milliseconds = String(dateObj.getMilliseconds()).padStart(3, '0');

    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`,
      milliseconds: milliseconds,
    };
  }

  /**
   * 检查是否需要重新同步
   */
  needsSync(): boolean {
    return Date.now() - this.lastSyncTime > this.syncInterval;
  }

  /**
   * 获取时间偏移量
   */
  getOffset(): number {
    return this.offset;
  }

  /**
   * 获取上次同步时间
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }
}

export default new TimeSync();
