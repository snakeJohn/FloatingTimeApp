import {TimeSync} from '../TimeSync';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TimeSync', () => {
  let timeSync: TimeSync;

  beforeEach(() => {
    timeSync = new TimeSync();
    jest.clearAllMocks();
  });

  describe('getCurrentTime', () => {
    it('应该返回当前时间加上偏移量', () => {
      const now = Date.now();
      const offset = 100;

      // 使用反射设置私有属性
      (timeSync as any).offset = offset;

      const result = timeSync.getCurrentTime();

      expect(result).toBeGreaterThanOrEqual(now + offset - 10);
      expect(result).toBeLessThanOrEqual(now + offset + 10);
    });
  });

  describe('getFormattedTime', () => {
    it('应该返回格式化的时间对象', () => {
      const result = timeSync.getFormattedTime();

      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('time');
      expect(result).toHaveProperty('milliseconds');

      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(result.milliseconds).toMatch(/^\d{3}$/);
    });

    it('日期格式应该正确填充零', () => {
      const result = timeSync.getFormattedTime();

      const [year, month, day] = result.date.split('-');
      expect(month.length).toBe(2);
      expect(day.length).toBe(2);
    });

    it('时间格式应该正确填充零', () => {
      const result = timeSync.getFormattedTime();

      const [hours, minutes, seconds] = result.time.split(':');
      expect(hours.length).toBe(2);
      expect(minutes.length).toBe(2);
      expect(seconds.length).toBe(2);
    });

    it('毫秒应该是三位数字', () => {
      const result = timeSync.getFormattedTime();

      expect(result.milliseconds.length).toBe(3);
      expect(parseInt(result.milliseconds, 10)).toBeGreaterThanOrEqual(0);
      expect(parseInt(result.milliseconds, 10)).toBeLessThanOrEqual(999);
    });
  });

  describe('needsSync', () => {
    it('初始状态应该需要同步', () => {
      expect(timeSync.needsSync()).toBe(true);
    });

    it('同步后短时间内不应该需要再次同步', () => {
      (timeSync as any).lastSyncTime = Date.now();
      expect(timeSync.needsSync()).toBe(false);
    });

    it('超过同步间隔后应该需要同步', () => {
      const oneHourAgo = Date.now() - 3600001; // 1小时+1毫秒前
      (timeSync as any).lastSyncTime = oneHourAgo;
      expect(timeSync.needsSync()).toBe(true);
    });
  });

  describe('syncTime', () => {
    it('应该成功同步 WorldTimeAPI 格式的时间', async () => {
      const mockResponse = {
        data: {
          unixtime: 1705300000,
          datetime: '2025-01-15T10:00:00.123456+08:00',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await timeSync.syncTime();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('offset');
      expect(result).toHaveProperty('precision');
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('应该成功同步 TimeAPI 格式的时间', async () => {
      const mockResponse = {
        data: {
          dateTime: '2025-01-15T10:00:00.123Z',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await timeSync.syncTime();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('offset');
      expect(result).toHaveProperty('precision');
    });

    it('应该处理多个服务器响应并计算平均值', async () => {
      const mockResponse1 = {
        data: {
          unixtime: 1705300000,
          datetime: '2025-01-15T10:00:00.000000+08:00',
        },
      };

      const mockResponse2 = {
        data: {
          dateTime: '2025-01-15T02:00:00.100Z',
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const result = await timeSync.syncTime();

      expect(result.timestamp).toBeDefined();
      expect(result.offset).toBeDefined();
      expect(result.precision).toBeDefined();
    });

    it('当所有服务器失败时应该抛出错误', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(timeSync.syncTime()).rejects.toThrow('所有时间服务器请求失败');
    });

    it('应该更新 lastSyncTime', async () => {
      const mockResponse = {
        data: {
          unixtime: 1705300000,
          datetime: '2025-01-15T10:00:00.000000+08:00',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const beforeSync = Date.now();
      await timeSync.syncTime();
      const afterSync = Date.now();

      const lastSyncTime = timeSync.getLastSyncTime();
      expect(lastSyncTime).toBeGreaterThanOrEqual(beforeSync);
      expect(lastSyncTime).toBeLessThanOrEqual(afterSync);
    });

    it('应该正确解析毫秒', async () => {
      const mockResponse = {
        data: {
          unixtime: 1705300000,
          datetime: '2025-01-15T10:00:00.456789+08:00',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await timeSync.syncTime();

      // 时间戳应该包含毫秒部分
      expect(result.timestamp % 1000).toBeCloseTo(456, -1);
    });

    it('应该处理没有毫秒的时间格式', async () => {
      const mockResponse = {
        data: {
          unixtime: 1705300000,
          datetime: '2025-01-15T10:00:00+08:00',
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await timeSync.syncTime();

      expect(result.timestamp).toBeDefined();
      expect(result.offset).toBeDefined();
    });
  });

  describe('getOffset', () => {
    it('应该返回当前的时间偏移量', () => {
      (timeSync as any).offset = 123;
      expect(timeSync.getOffset()).toBe(123);
    });

    it('初始偏移量应该为 0', () => {
      expect(timeSync.getOffset()).toBe(0);
    });
  });

  describe('getLastSyncTime', () => {
    it('应该返回上次同步时间', () => {
      const syncTime = Date.now();
      (timeSync as any).lastSyncTime = syncTime;
      expect(timeSync.getLastSyncTime()).toBe(syncTime);
    });

    it('初始同步时间应该为 0', () => {
      expect(timeSync.getLastSyncTime()).toBe(0);
    });
  });
});
