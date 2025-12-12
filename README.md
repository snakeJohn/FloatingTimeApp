# 悬浮时间 ⏱️

<div align="center">

[![构建状态](https://github.com/yourusername/floating-time/actions/workflows/build.yml/badge.svg)](https://github.com/yourusername/floating-time/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)

一个精确到毫秒的悬浮时间显示应用，支持 Android 和 iOS 平台

[功能特性](#功能特性) •
[快速开始](#快速开始) •
[构建指南](#构建指南) •
[部署文档](#部署文档) •
[常见问题](#常见问题)

</div>

---

## 📱 功能特性

- ⏱️ **毫秒精度**: 显示精确到毫秒的时间，满足高精度需求
- 🌐 **网络同步**: 自动同步网络时间服务器，确保时间准确性
- 📍 **悬浮显示**: 可拖动的悬浮窗口，不影响其他应用使用
- 🎨 **美观界面**: 半透明黑色背景，高对比度显示
- 🔄 **自动更新**: 每小时自动同步一次网络时间
- 📱 **跨平台**: 同时支持 Android 和 iOS 平台
- 🚀 **高性能**: 使用 React Native 和原生代码优化
- 🔋 **省电模式**: 智能更新策略，降低电量消耗

## 🎯 适用场景

- 需要精确计时的场合
- 开发调试时查看精确时间
- 直播、录制等需要时间戳的场景
- 考试、比赛等严格计时的活动

## 📸 应用截图

<div align="center">
  <img src="docs/images/screenshot-android.png" width="300" alt="Android 截图" />
  <img src="docs/images/screenshot-ios.png" width="300" alt="iOS 截图" />
</div>

## 🚀 快速开始

### 前置要求

确保你的开发环境已安装以下工具：

- Node.js >= 18
- npm >= 9
- React Native 开发环境

**Android 开发需要：**
- JDK 17
- Android Studio
- Android SDK (API 34)

**iOS 开发需要：**
- macOS 操作系统
- Xcode 15+
- CocoaPods

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/yourusername/floating-time.git
cd floating-time
```

2. **安装依赖**

```bash
npm install
```

3. **iOS 额外步骤**（仅 macOS）

```bash
cd ios
pod install
cd ..
```

### 运行应用

**Android:**

```bash
npm run android
```

**iOS:**（仅 macOS）

```bash
npm run ios
```

## 🔨 构建指南

详细的构建说明请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

### 快速构建

**构建 Android APK:**

```bash
cd android
./gradlew assembleRelease
```

生成的 APK 位于: `android/app/build/outputs/apk/release/app-release.apk`

**构建 iOS IPA:**（需要 macOS）

```bash
cd ios
xcodebuild -workspace FloatingTime.xcworkspace \
  -scheme FloatingTime \
  -configuration Release \
  -archivePath build/FloatingTime.xcarchive \
  archive
```

## 🤖 GitHub Actions 自动构建

本项目已配置 GitHub Actions，可自动构建 Android 和 iOS 版本。

### 触发构建

1. **推送代码到主分支**
   ```bash
   git push origin main
   ```

2. **创建发布标签**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **手动触发**
   - 进入 GitHub 仓库的 Actions 页面
   - 选择 "构建 Android 和 iOS" workflow
   - 点击 "Run workflow"

### 下载构建产物

- 在 Actions 页面找到对应的 workflow 运行记录
- 下载 `android-release` 或 `ios-release` 产物
- 标签推送会自动创建 GitHub Release

## 📖 技术架构

### 核心技术栈

- **框架**: React Native 0.73
- **语言**: TypeScript
- **状态管理**: React Hooks
- **动画**: React Native Reanimated
- **手势**: React Native Gesture Handler
- **网络请求**: Axios

### 项目结构

```
floating-time/
├── src/
│   ├── services/
│   │   └── TimeSync.ts          # 时间同步服务
│   └── components/               # UI 组件（未来扩展）
├── android/                      # Android 原生代码
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/floatingtime/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   └── MainApplication.kt
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/
│   │   └── build.gradle
│   └── build.gradle
├── ios/                          # iOS 原生代码
│   ├── FloatingTime/
│   │   ├── AppDelegate.h
│   │   ├── AppDelegate.mm
│   │   ├── Info.plist
│   │   └── main.m
│   └── Podfile
├── .github/
│   └── workflows/
│       └── build.yml             # GitHub Actions 配置
├── App.tsx                       # 应用入口
├── package.json
└── README.md
```

### 时间同步原理

1. **多服务器策略**: 同时请求多个时间服务器
2. **延迟补偿**: 计算网络往返时间（RTT）并补偿
3. **平均值算法**: 取多个服务器时间的平均值
4. **精度计算**: 通过标准差评估时间精度
5. **定期同步**: 每小时自动重新同步一次

支持的时间服务器：
- WorldTimeAPI (worldtimeapi.org)
- TimeAPI (timeapi.io)

## ⚙️ 配置说明

### 修改同步间隔

编辑 `src/services/TimeSync.ts`:

```typescript
private syncInterval: number = 3600000; // 1小时 = 3600000ms
```

### 添加自定义时间服务器

编辑 `src/services/TimeSync.ts`:

```typescript
private timeServers = [
  'https://worldtimeapi.org/api/timezone/Asia/Shanghai',
  'https://your-custom-server.com/api/time',
];
```

### 自定义 UI 样式

编辑 `App.tsx` 中的 `styles` 对象。

## 🔐 权限说明

### Android

- `INTERNET`: 用于同步网络时间
- `SYSTEM_ALERT_WINDOW`: 用于显示悬浮窗口
- `ACCESS_NETWORK_STATE`: 检查网络连接状态

### iOS

- 网络访问权限（自动授予）
- 无需额外权限配置

## 🐛 常见问题

### Android 悬浮窗不显示？

确保已授予应用"悬浮窗权限"：
1. 打开系统设置
2. 应用管理 → 悬浮时间
3. 权限 → 悬浮窗 → 允许

### 时间同步失败？

1. 检查网络连接
2. 确认防火墙未屏蔽时间服务器
3. 查看应用日志获取详细错误信息

### iOS 构建失败？

1. 确保已运行 `pod install`
2. 清理构建缓存: `cd ios && xcodebuild clean`
3. 更新 CocoaPods: `pod repo update`

### GitHub Actions 构建失败？

1. 检查 workflow 日志查看具体错误
2. 确认 Node.js 版本兼容
3. iOS 构建需要 macOS runner

## 🤝 贡献指南

欢迎贡献代码、报告 Bug 或提出新功能建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 MIT 协议开源 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 致谢

- [React Native](https://reactnative.dev/) - 跨平台移动应用框架
- [WorldTimeAPI](http://worldtimeapi.org/) - 免费的时间 API 服务
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - 高性能动画库

## 📮 联系方式

如有问题或建议，请：
- 提交 [Issue](https://github.com/yourusername/floating-time/issues)
- 发送邮件至: your.email@example.com

---

<div align="center">
  Made with ❤️ by developers, for developers
</div>
