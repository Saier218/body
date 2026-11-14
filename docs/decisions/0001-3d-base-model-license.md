# 0001 3D 底模来源与授权

- 状态：**生效**（有一项遗留风险，见下）
- 日期：2026-11-13（当日核实）

## 结论

底模使用 **BodyParts3D 4.0 版**，从 DBCLS 官方归档站直接下载，按 **CC BY 4.0** 使用。
不使用 Z-Anatomy，不使用 Zygote、3D body 等任何商业产品的模型。

署名原文（须出现在应用的"关于 / 致谢"页与模型文件旁）：

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

我们自己生成或补建的结构（滑车等）不是 BodyParts3D 的一部分，版权归项目所有；它们依据 BodyParts3D 的骨骼与肌腱形状拟合而成，随模型分发时一并保留上述署名。

## 核实到的事实

| 事项 | 结果 | 依据 |
|---|---|---|
| 当前协议 | CC BY 4.0，许可页"Last updated: 2025/02/27" | 已读官方许可页原文；用户也独立提供了同一段文字 |
| 下载内容 | `isa_BP3D_4.0_obj_99.zip`，136 MB，2234 个 OBJ，共约 668 万面 | 官方 LATEST 目录 |
| 文件校验 | sha256 `40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e` | 本地计算 |
| 手、腕部已有 | 全部指骨、掌骨、腕骨；鱼际与小鱼际肌群；蚓状肌、骨间背侧肌、骨间掌侧肌（各为一个合并网格）；屈肌支持带 | 按坐标范围清点 |
| 前臂已有 | 全部屈肌与伸肌、旋前旋后肌、骨间膜；指深屈肌与指浅屈肌的网格包含一直延伸到指尖的肌腱 | 同上，并渲染确认 |
| 肩部已有 | 肩袖四肌、三角肌三部、肱二头肌长短头、肩胛骨、锁骨、肱骨等 | 同上 |
| **缺失** | 指屈肌腱滑车（A1–A5、C1–C3）、指关节侧副韧带与掌板、伸肌腱帽、腕部韧带、TFCC、盂唇、盂肱韧带、关节囊、滑囊 | 部件清单中无对应条目 |

## 遗留风险

压缩包内的 OBJ 文件是 2013 年生成的，每个文件头部的注释仍写着旧协议（CC BY-SA 2.1 Japan）；而官方许可页与 README 在 2025-02-27 已更新为 CC BY 4.0，并声明适用于"this database"。

- 我们的判断：以官方许可页为准，文件头是未更新的旧文字。
- 最坏情况：即使按旧协议，也允许商用，只是修改后的模型需以相同方式共享。不会出现"不能商用"的结果。
- 降低风险的做法：保存许可页与 README 的存档和下载日期；上线前给 DBCLS 发一封邮件请其书面确认（许可页列有联系方式）。**待办。**

## 被否决的选项

- **Z-Anatomy**：CC BY-SA 4.0，且混有不可商用部件（内耳 CC BY-NC-SA、肾脏 CC BY-NC），需逐网格核对来源。
- **Zygote Body**：查看器代码开源，但模型是 Zygote Media Group 的专有资产，不可用。
- **GitHub 上的 BodyParts3D 镜像**：是 3.0 旧版并标注旧协议，仅用于了解内容，不进入产品。

## 来源

- https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html
- https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/
- https://github.com/Z-Anatomy/Models-of-human-anatomy
