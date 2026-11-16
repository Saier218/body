# body

面向攀岩者的运动损伤科普 App（代号，名称待定）。工作准则见 `CLAUDE.md`，整体结构见 `docs/architecture.md`，各项决定见 `docs/decisions/`。

## 在电脑上运行

需要先安装 [Node.js](https://nodejs.org/) 22.12 或更高版本。

```bash
npm install
```

```bash
npm run dev
```

终端会显示一个本地地址，用浏览器打开即可。手机和电脑连同一个 Wi-Fi 时，用手机浏览器打开终端里显示的 Network 地址，可以直接在手机上试触摸操作。

## 检查

```bash
npm run check
```

依次运行类型检查、构建和端到端测试。

## 装进手机 App

```bash
npm run cap:sync
```

然后用 Android Studio 打开 `android/` 文件夹，或用 Xcode 打开 `ios/App/App.xcodeproj`，点运行。iOS 需要 Mac。

## 目录

| 路径 | 内容 |
|---|---|
| `apps/app` | App 的界面 |
| `packages/viewer-core` | 与平台无关的 3D 核心 |
| `ios`、`android` | Capacitor 生成的原生外壳 |
| `tools/modeling` | 模型流水线 |
| `models/generated` | 流水线产出的模型与目录 |
| `apps/miniprogram` | 已冻结的小程序外壳 |

## 致谢

解剖底模：BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International
