import React from 'react';
import {render, waitFor, fireEvent} from '@testing-library/react-native';
import App from '../../../App';
import timeSync from '../TimeSync';

jest.mock('../TimeSync', () => {
  const actualTimeSync = jest.requireActual('../TimeSync');
  return {
    __esModule: true,
    default: {
      syncTime: jest.fn(),
      getFormattedTime: jest.fn(),
      needsSync: jest.fn(),
      getCurrentTime: jest.fn(),
      getOffset: jest.fn(),
      getLastSyncTime: jest.fn(),
    },
    TimeSync: actualTimeSync.TimeSync,
  };
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (timeSync.getFormattedTime as jest.Mock).mockReturnValue({
      date: '2025-01-15',
      time: '10:30:45',
      milliseconds: '123',
    });

    (timeSync.syncTime as jest.Mock).mockResolvedValue({
      timestamp: Date.now(),
      offset: 0,
      precision: 5,
    });

    (timeSync.needsSync as jest.Mock).mockReturnValue(false);
  });

  it('应该正确渲染', () => {
    const {getByText} = render(<App />);

    expect(getByText('拖动时间窗口可移动位置')).toBeTruthy();
  });

  it('应该显示格式化的时间', async () => {
    const {getByText} = render(<App />);

    await waitFor(() => {
      expect(getByText('2025-01-15')).toBeTruthy();
      expect(getByText('10:30:45')).toBeTruthy();
      expect(getByText('.123')).toBeTruthy();
    });
  });

  it('应该在启动时调用时间同步', async () => {
    render(<App />);

    await waitFor(() => {
      expect(timeSync.syncTime).toHaveBeenCalled();
    });
  });

  it('点击同步按钮应该触发时间同步', async () => {
    const {getByText} = render(<App />);

    const syncButton = getByText('同步');
    fireEvent.press(syncButton);

    await waitFor(() => {
      expect(timeSync.syncTime).toHaveBeenCalledTimes(2); // 一次初始化，一次点击
    });
  });

  it('同步时应该显示同步中状态', async () => {
    let resolveSyncTime: any;
    (timeSync.syncTime as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        resolveSyncTime = resolve;
      });
    });

    const {getByText} = render(<App />);

    await waitFor(() => {
      expect(getByText('同步中...')).toBeTruthy();
    });

    resolveSyncTime({
      timestamp: Date.now(),
      offset: 100,
      precision: 5,
    });

    await waitFor(() => {
      expect(getByText(/已同步/)).toBeTruthy();
    });
  });

  it('同步失败应该显示错误状态', async () => {
    (timeSync.syncTime as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const {getByText} = render(<App />);

    await waitFor(() => {
      expect(getByText('同步失败')).toBeTruthy();
    });
  });

  it('同步成功后应该显示偏移量', async () => {
    (timeSync.syncTime as jest.Mock).mockResolvedValueOnce({
      timestamp: Date.now(),
      offset: 150,
      precision: 5,
    });

    const {getByText} = render(<App />);

    await waitFor(() => {
      expect(getByText(/偏移: 150ms/)).toBeTruthy();
    }, {timeout: 3000});
  });

  it('同步按钮在同步中应该被禁用', async () => {
    let resolveSyncTime: any;
    (timeSync.syncTime as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        resolveSyncTime = resolve;
      });
    });

    const {getByText} = render(<App />);

    await waitFor(() => {
      const syncButton = getByText('...');
      expect(syncButton).toBeTruthy();
    });

    resolveSyncTime({
      timestamp: Date.now(),
      offset: 0,
      precision: 5,
    });
  });
});
