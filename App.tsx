import React, {useEffect, useState, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  AppState,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import {GestureHandlerRootView, PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import timeSync from './src/services/TimeSync';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

function App(): JSX.Element {
  const [time, setTime] = useState({
    date: '',
    time: '',
    milliseconds: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('未同步');
  const [offset, setOffset] = useState(0);

  const translateX = useSharedValue(SCREEN_WIDTH - 200);
  const translateY = useSharedValue(100);

  // 初始化时间同步
  useEffect(() => {
    syncTimeWithServer();

    // 定时更新显示
    const displayInterval = setInterval(() => {
      const currentTime = timeSync.getFormattedTime();
      setTime(currentTime);
    }, 1); // 1ms 更新一次以显示毫秒

    // 定期检查是否需要重新同步
    const syncCheckInterval = setInterval(() => {
      if (timeSync.needsSync()) {
        syncTimeWithServer();
      }
    }, 60000); // 每分钟检查一次

    // 监听应用状态变化
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // 应用进入前台时检查是否需要同步
        if (timeSync.needsSync()) {
          syncTimeWithServer();
        }
      }
    });

    return () => {
      clearInterval(displayInterval);
      clearInterval(syncCheckInterval);
      subscription.remove();
    };
  }, []);

  // 同步网络时间
  const syncTimeWithServer = async () => {
    setIsSyncing(true);
    setSyncStatus('同步中...');

    try {
      const result = await timeSync.syncTime();
      setOffset(result.offset);
      setSyncStatus(`已同步 (偏移: ${result.offset.toFixed(0)}ms)`);

      // 3秒后隐藏同步状态
      setTimeout(() => {
        setSyncStatus('已同步');
      }, 3000);
    } catch (error) {
      setSyncStatus('同步失败');
      console.error('Time sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // 手势处理 - 拖动悬浮窗
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      // 边界限制
      if (translateX.value < 0) {
        translateX.value = withSpring(0);
      } else if (translateX.value > SCREEN_WIDTH - 180) {
        translateX.value = withSpring(SCREEN_WIDTH - 180);
      }

      if (translateY.value < 0) {
        translateY.value = withSpring(0);
      } else if (translateY.value > SCREEN_HEIGHT - 120) {
        translateY.value = withSpring(SCREEN_HEIGHT - 120);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
      ],
    };
  });

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.floatingWindow, animatedStyle]}>
          <View style={styles.timeContainer}>
            <Text style={styles.dateText}>{time.date}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{time.time}</Text>
              <Text style={styles.millisecondText}>.{time.milliseconds}</Text>
            </View>

            <View style={styles.statusRow}>
              <Text style={[
                styles.statusText,
                isSyncing && styles.statusSyncing,
                syncStatus.includes('失败') && styles.statusError,
              ]}>
                {syncStatus}
              </Text>

              <TouchableOpacity
                style={styles.syncButton}
                onPress={syncTimeWithServer}
                disabled={isSyncing}
              >
                <Text style={styles.syncButtonText}>
                  {isSyncing ? '...' : '同步'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.hint}>
        <Text style={styles.hintText}>拖动时间窗口可移动位置</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  floatingWindow: {
    position: 'absolute',
    width: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timeContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  millisecondText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 2,
    fontVariant: ['tabular-nums'],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#4CAF50',
    flex: 1,
  },
  statusSyncing: {
    color: '#FFC107',
  },
  statusError: {
    color: '#F44336',
  },
  syncButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  syncButtonText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});

export default App;
