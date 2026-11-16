# 0007 伤病日志的本地存储技术

- 状态：设计已定，代码未写（等页面设计确定日志字段后实现）
- 日期：2026-11-16
- 关联：决策 0002（第一版只做本地加导出）

## 结论

日志存为 App 私有目录下的一个 JSON 文件，通过 Capacitor 的文件系统能力读写；导出与导入走系统分享面板和文件选择。不使用浏览器的 localStorage 保存日志。

## 理由

- App 里的界面运行在内置浏览器中。系统在存储紧张时可能清理浏览器存储，日志这类不能丢的数据不应放在那里（此为通行经验，未逐个系统版本核实）。
- 单个文件天然就是导出格式，备份与迁移最简单。
- 日后加云同步时，同步的也是这份文件的内容。

## 接口约定

所有页面只通过一个模块访问日志，不直接碰文件：

```ts
interface InjuryLogStore {
  list(): Promise<LogEntry[]>;
  save(entry: LogEntry): Promise<void>;      // 新增或按 id 覆盖
  remove(id: string): Promise<void>;
  exportFile(): Promise<void>;               // 调起系统分享
  importFile(): Promise<{ added: number; skipped: number }>;
  eraseAll(): Promise<void>;                 // 个人信息保护法要求的"可删除"
}
```

文件带格式版本号，读取时先做版本迁移。浏览器开发模式下用内存实现代替，以便自动测试。

## 合规要点（准则 3.3）

- 首次写入日志前单独征得同意，并说明数据只存在本机。
- 提供一键全部删除与导出。
- 不随日志采集任何设备标识。
