# 编译安卓安装包

2026-11-16 在云端 Linux 环境中验证通过，产出 5.1 MB 的调试安装包。**该安装包没有在任何真机或模拟器上运行过。**

## 在 Mac 上（推荐）

1. 安装 Android Studio，首次启动时按向导装好 SDK。
2. 在仓库根目录运行：

```bash
npm install
```

```bash
npm run cap:sync
```

3. 用 Android Studio 打开 `android/` 文件夹，等它同步完成，连接手机（需打开开发者选项中的 USB 调试），点运行。

## 纯命令行（云端验证时用的步骤）

需要 JDK 21 和 Node 22。

```bash
npm ci && npm run build && npx cap sync android
```

```bash
curl -fsS -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-16111833_latest.zip
mkdir -p /opt/android-sdk/cmdline-tools x && unzip -q cmdline-tools.zip -d x && mv x/cmdline-tools /opt/android-sdk/cmdline-tools/latest
export ANDROID_HOME=/opt/android-sdk
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"
```

```bash
cd android && echo "sdk.dir=/opt/android-sdk" > local.properties && ./gradlew assembleDebug --no-daemon
```

安装包在 `android/app/build/outputs/apk/debug/app-debug.apk`。Mac 上请把下载地址里的 `linux` 换成 `mac`。

## 验证时记录的情况

| 项目 | 数值 |
|---|---|
| 工具版本 | Gradle 8.14.3，Android Gradle 插件 8.13.0，build-tools 35.0.0，platform android-36 |
| 首次编译耗时 | 约 2 分钟（含下载依赖） |
| 占用磁盘 | SDK 约 0.5 GB，Gradle 缓存约 1.1 GB |
| 安装包 | 最低 Android 7.0，目标 API 36，包内含界面文件和手部模型 |
| 对 `android/` 的改动 | 无，除了本机专用的 `local.properties`（已被忽略，不入库） |

## 注意

- 调试安装包用的是自动生成的调试签名，**不能用于上架**。上架需要另建正式签名并妥善保管，签名文件不得入库。
- 应用标识仍是占位的 `com.placeholder.body`，上架前必须改。
- 谷歌的命令行工具提示 `sdkmanager` 已被弃用，将由新的 `android` 命令取代。上述步骤目前仍可用，新命令未测试。
- 模板里带有谷歌推送服务的构建依赖，但因为没有配置文件，实际未启用，安装包里没有推送相关功能。
