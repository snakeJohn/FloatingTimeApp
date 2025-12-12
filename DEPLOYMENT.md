# 悬浮时间 - 部署指南 📦

本文档提供详细的构建和部署说明，帮助你将应用打包为 APK（Android）和 IPA（iOS）。

## 目录

- [环境准备](#环境准备)
- [Android 部署](#android-部署)
- [iOS 部署](#ios-部署)
- [GitHub Actions 自动化](#github-actions-自动化)
- [发布流程](#发布流程)
- [常见问题排查](#常见问题排查)

---

## 环境准备

### 通用要求

1. **安装 Node.js**
   ```bash
   # 下载并安装 Node.js 18+
   # https://nodejs.org/

   # 验证安装
   node --version  # 应显示 v18.x.x 或更高
   npm --version   # 应显示 9.x.x 或更高
   ```

2. **克隆项目并安装依赖**
   ```bash
   git clone https://github.com/yourusername/floating-time.git
   cd floating-time
   npm install
   ```

### Android 环境

1. **安装 JDK 17**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install openjdk-17-jdk

   # macOS (使用 Homebrew)
   brew install openjdk@17

   # Windows
   # 下载并安装 OpenJDK 17
   # https://adoptium.net/

   # 验证安装
   java -version  # 应显示 17.x.x
   ```

2. **配置环境变量**

   在 `~/.bashrc` 或 `~/.zshrc` 中添加：
   ```bash
   export JAVA_HOME=/path/to/jdk17
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **安装 Android Studio**
   - 下载: https://developer.android.com/studio
   - 安装 Android SDK Platform 34
   - 安装 Android SDK Build-Tools 34.0.0

### iOS 环境（仅 macOS）

1. **安装 Xcode**
   ```bash
   # 从 App Store 安装 Xcode 15+
   # 或使用命令行工具
   xcode-select --install
   ```

2. **安装 CocoaPods**
   ```bash
   sudo gem install cocoapods

   # 验证安装
   pod --version
   ```

---

## Android 部署

### 1. 生成签名密钥

**首次构建需要生成签名密钥：**

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

输入密钥信息：
- Keystore 密码（妥善保管）
- 姓名、组织等信息

**保存密钥信息：**

创建 `android/gradle.properties` 文件（如不存在）：

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=你的keystore密码
MYAPP_RELEASE_KEY_PASSWORD=你的key密码
```

⚠️ **重要**: 将 `gradle.properties` 添加到 `.gitignore`，不要提交到版本控制！

### 2. 构建 Release APK

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

构建成功后，APK 位于：
```
android/app/build/outputs/apk/release/app-release.apk
```

### 3. 构建 AAB（Google Play）

如果要上传到 Google Play，需要构建 AAB 格式：

```bash
cd android
./gradlew bundleRelease
```

AAB 文件位于：
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 4. 测试 APK

```bash
# 安装到连接的设备
adb install android/app/build/outputs/apk/release/app-release.apk

# 或手动传输 APK 到设备安装
```

### 5. 优化 APK 大小

**启用 ProGuard 混淆（已配置）：**
- 查看 `android/app/build.gradle`
- `minifyEnabled true` 已启用

**分析 APK 大小：**
```bash
cd android
./gradlew analyzeReleaseBundle
```

---

## iOS 部署

### 1. 安装依赖

```bash
cd ios
pod install
cd ..
```

### 2. 配置签名（开发构建）

开发构建可使用自动签名，无需付费开发者账号。

在 Xcode 中：
1. 打开 `ios/FloatingTime.xcworkspace`
2. 选择项目 → Signing & Capabilities
3. Team 选择 "None" 或你的 Apple ID
4. 取消勾选 "Automatically manage signing"

### 3. 构建存档（Archive）

**方式一：使用 Xcode**

1. 打开 `ios/FloatingTime.xcworkspace`
2. 选择 Generic iOS Device
3. Product → Archive
4. 等待构建完成
5. 在 Organizer 中导出 IPA

**方式二：使用命令行**

```bash
cd ios

# 构建存档
xcodebuild -workspace FloatingTime.xcworkspace \
  -scheme FloatingTime \
  -configuration Release \
  -archivePath build/FloatingTime.xcarchive \
  archive

# 导出 IPA（开发版本，无签名）
xcodebuild -exportArchive \
  -archivePath build/FloatingTime.xcarchive \
  -exportPath build \
  -exportOptionsPlist exportOptions.plist
```

IPA 文件位于：`ios/build/FloatingTime.ipa`

### 4. 配置生产签名（App Store）

**需要 Apple Developer 账号（$99/年）**

1. **创建 App ID**
   - 登录 https://developer.apple.com/account
   - Certificates, Identifiers & Profiles
   - Identifiers → 添加 App ID
   - Bundle ID: `com.floatingtime`

2. **创建证书**
   - Certificates → 添加证书
   - 选择 "iOS Distribution (App Store and Ad Hoc)"
   - 上传 CSR 文件

3. **创建描述文件**
   - Profiles → 添加描述文件
   - 选择 "App Store"
   - 关联 App ID 和证书
   - 下载并双击安装

4. **在 Xcode 中配置**
   - Signing & Capabilities
   - Team: 选择你的开发团队
   - Provisioning Profile: 选择刚创建的描述文件

5. **构建并上传**
   ```bash
   # 构建
   xcodebuild -workspace FloatingTime.xcworkspace \
     -scheme FloatingTime \
     -configuration Release \
     -archivePath build/FloatingTime.xcarchive \
     archive

   # 上传到 App Store Connect
   xcodebuild -exportArchive \
     -archivePath build/FloatingTime.xcarchive \
     -exportPath build \
     -exportOptionsPlist exportOptions-appstore.plist
   ```

### 5. TestFlight 测试

- 在 App Store Connect 创建应用
- 上传 IPA
- 提交 Beta 测试审核
- 邀请测试用户

---

## GitHub Actions 自动化

本项目已配置 GitHub Actions，可自动构建两个平台。

### 配置步骤

1. **推送代码到 GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/floating-time.git
   git push -u origin main
   ```

2. **配置 Secrets（可选）**

   如需自动签名，在 GitHub 仓库设置中添加：

   **Android Secrets:**
   - `ANDROID_KEYSTORE_BASE64`: keystore 文件的 Base64 编码
   - `ANDROID_KEYSTORE_PASSWORD`: keystore 密码
   - `ANDROID_KEY_ALIAS`: 密钥别名
   - `ANDROID_KEY_PASSWORD`: 密钥密码

   生成 Base64：
   ```bash
   base64 -i my-release-key.keystore | pbcopy
   ```

   **iOS Secrets（需要 Apple 开发者账号）:**
   - `IOS_CERTIFICATE_BASE64`: 证书 .p12 文件的 Base64
   - `IOS_CERTIFICATE_PASSWORD`: 证书密码
   - `IOS_PROVISIONING_PROFILE_BASE64`: 描述文件的 Base64

3. **触发构建**

   **自动触发：**
   - 推送到 `main` 或 `develop` 分支
   - 创建 Pull Request
   - 推送标签（如 `v1.0.0`）

   **手动触发：**
   - GitHub → Actions → "构建 Android 和 iOS" → "Run workflow"

4. **下载产物**
   - 进入 Actions 页面
   - 选择对应的 workflow 运行
   - 下载 `android-release` 或 `ios-release`

### Workflow 说明

`.github/workflows/build.yml` 包含三个 jobs：

- **build-android**: 构建 Android APK
- **build-ios**: 构建 iOS IPA
- **lint**: 代码检查

标签推送会自动创建 GitHub Release 并上传安装包。

---

## 发布流程

### 版本号管理

1. **更新版本号**

   Android (`android/app/build.gradle`):
   ```gradle
   versionCode 2           // 每次发布递增
   versionName "1.0.1"     // 语义化版本
   ```

   iOS (`ios/FloatingTime/Info.plist`):
   ```xml
   <key>CFBundleShortVersionString</key>
   <string>1.0.1</string>
   <key>CFBundleVersion</key>
   <string>2</string>
   ```

   Package (`package.json`):
   ```json
   "version": "1.0.1"
   ```

2. **创建发布标签**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

3. **GitHub Actions 自动构建**
   - 自动触发构建
   - 自动创建 GitHub Release
   - 上传 APK 和 IPA

### Google Play 发布

1. **创建 Google Play Console 账号**
   - https://play.google.com/console
   - 注册费用：$25（一次性）

2. **创建应用**
   - 填写应用信息
   - 上传图标、截图
   - 设置内容分级

3. **上传 AAB**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   - 在 Play Console 上传 AAB
   - 填写版本说明

4. **发布**
   - 内部测试 → Alpha → Beta → 生产
   - 等待审核（通常 1-3 天）

### App Store 发布

1. **准备资料**
   - 应用截图（各种设备尺寸）
   - 应用图标 1024x1024
   - 应用描述、关键词
   - 隐私政策链接

2. **在 App Store Connect 创建应用**
   - https://appstoreconnect.apple.com
   - 填写应用信息

3. **上传 IPA**
   - 使用 Xcode 或 Transporter
   - 或使用命令行上传

4. **提交审核**
   - 填写审核信息
   - 等待审核（通常 1-3 天）

---

## 常见问题排查

### Android 构建失败

**问题：Execution failed for task ':app:processReleaseResources'**

解决：
```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

**问题：Could not find or load main class org.gradle.wrapper.GradleWrapperMain**

解决：
```bash
cd android
gradle wrapper --gradle-version 8.1.1
chmod +x gradlew
```

**问题：Keystore file not found**

解决：
- 确认 keystore 文件路径正确
- 检查 `gradle.properties` 配置

### iOS 构建失败

**问题：No provisioning profiles found**

解决：
- 使用 Xcode 手动管理签名
- 或创建并安装描述文件

**问题：Command PhaseScriptExecution failed**

解决：
```bash
cd ios
pod deintegrate
pod install
```

**问题：Library not found**

解决：
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

### GitHub Actions 失败

**问题：Permission denied**

解决：
```bash
git update-index --chmod=+x android/gradlew
git commit -m "fix: add execute permission to gradlew"
```

**问题：iOS 构建超时**

解决：
- GitHub 免费账号有构建时长限制
- 考虑使用自托管 runner
- 或本地构建后上传

### 运行时问题

**问题：无法连接时间服务器**

检查：
- 网络连接
- 防火墙设置
- 时间服务器 URL 是否有效

**问题：悬浮窗不显示（Android）**

解决：
- 设置 → 应用 → 悬浮时间 → 权限 → 悬浮窗 → 允许

---

## 下一步

- [ ] 阅读 [README.md](README.md) 了解功能特性
- [ ] 配置开发环境
- [ ] 本地构建测试
- [ ] 设置 GitHub Actions
- [ ] 发布第一个版本

如有问题，请提交 [Issue](https://github.com/yourusername/floating-time/issues)。

---

**祝你部署顺利！** 🚀
