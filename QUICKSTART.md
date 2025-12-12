# 快速启动指南 🚀

本指南帮助你快速启动和运行悬浮时间项目。

## 前提条件

- Node.js 18+
- npm 9+
- Android Studio（Android 开发）
- Xcode 15+（iOS 开发，仅 macOS）

## 5 分钟快速启动

### 步骤 1: 安装依赖

```bash
cd "m:\悬浮时间\悬浮时间2"
npm install
```

### 步骤 2: iOS 额外配置（仅 macOS）

```bash
cd ios
pod install
cd ..
```

### 步骤 3: 运行测试

```bash
npm test
```

### 步骤 4: 启动应用

**Android:**
```bash
# 确保 Android 设备已连接或模拟器已启动
npm run android
```

**iOS (仅 macOS):**
```bash
npm run ios
```

## 验证清单

运行以下命令确保一切正常：

```bash
# 1. 类型检查
npm run type-check

# 2. 代码检查
npm run lint

# 3. 运行测试
npm test

# 4. 生成覆盖率报告
npm run test:coverage
```

## 常见问题

### 问题 1: `metro.config.js` not found

**解决**: 确保所有新文件都已创建。查看 `PROJECT_STATUS.md` 中的文件清单。

### 问题 2: Android 构建失败

**解决**:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### 问题 3: iOS Pod Install 失败

**解决**:
```bash
cd ios
pod repo update
pod install
```

### 问题 4: 测试失败

**解决**: 确保所有依赖已安装：
```bash
rm -rf node_modules
npm install
npm test
```

## 开发工作流

### 1. 开发模式

```bash
# 终端 1: 启动 Metro
npm start

# 终端 2: 运行应用
npm run android  # 或 npm run ios
```

### 2. 监听测试

```bash
npm run test:watch
```

### 3. 代码格式化

```bash
npm run format
npm run lint:fix
```

## 构建发布版本

### Android APK

```bash
cd android
./gradlew assembleRelease
# APK 位置: android/app/build/outputs/apk/release/app-release.apk
```

### iOS IPA

```bash
# 使用 Xcode 打开项目
open ios/FloatingTime.xcworkspace

# 或使用命令行
cd ios
xcodebuild -workspace FloatingTime.xcworkspace \
  -scheme FloatingTime \
  -configuration Release \
  archive
```

## 文档

- [README.md](README.md) - 完整项目说明
- [DEPLOYMENT.md](DEPLOYMENT.md) - 详细部署指南
- [BUG_FIX_REPORT.md](BUG_FIX_REPORT.md) - Bug 修复报告
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 项目状态

## 获取帮助

如遇到问题：
1. 查看上述文档
2. 检查 [GitHub Issues](https://github.com/yourusername/floating-time/issues)
3. 提交新 Issue

---

**祝开发顺利！** 🎉
