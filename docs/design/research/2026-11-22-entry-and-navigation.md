# 同类调研：首屏与 3D 导航

- 日期：2026-11-22
- 目的：决定打开 App 看到什么、从全身走到具体结构的路径怎么设计
- 方法：8 次网络检索，读到的是各产品的官方帮助页、应用商店介绍、大学使用指南、少量论文与设计机构文章。**没有亲手试用任何一款 App**，所以视觉细节以文字描述为准，不代表实际手感。

## 看了谁

| 产品 | 类型 | 一打开是什么 | 怎么深入 | 别人怎么评价 |
|---|---|---|---|---|
| Complete Anatomy | 专业解剖（3D） | 首页"Hub"，从这里进入 3D 模型 | 底部一排系统开关（骨骼、肌肉…）；左上角"Home"按钮让模型回到初始姿态；点结构看信息；全局搜索 | 新版 iPad 上返回和 Home 按钮被系统按钮挡住，导航困难 |
| Visible Body 解剖图谱 | 专业解剖（3D） | 首页是各个模型的预览卡片；顶部菜单可按部位、按系统、按断面浏览 | 进入模型后用"系统托盘"加减图层，可限定在某个部位 | 返回首页的箭头太小且在左上角，手机上容易误点 |
| BioDigital Human | 专业解剖（3D，网页起家） | "我的库"与"探索"两个入口 | 模型内一个独立的探索工具菜单，左侧是章节导航 | 用户抱怨导航和旋转模型困难 |
| 3Dbody、维萨里、万康等国内应用 | 解剖教学（3D） | 按"系统解剖 / 局部解剖"分板块进入 | 局部解剖从浅层到深层逐层显示 | 未找到独立评测 |
| Muscle & Motion | 运动解剖（3D） | 以训练动作为主，3D 模型在任何页面都能打开 | 搜索为主，动作里高亮发力肌肉 | 有用户反映卡顿、不稳定 |
| MuscleWiki | 健身（2D 人体图） | 正反两面的人体肌肉图就是主导航 | 点一个部位直接列出该部位的训练动作 | 分区太粗：胸、背各只有一块，无法细分上下部 |
| MuscleMap Fitness | 健身（3D 人体） | 3D 人体 | 点外层肌肉逐层露出深层 | 未找到评测 |
| 症状记录类应用（CareClinic、Symptom Memo 等） | 健康记录（2D 人体图） | 正面/背面人体轮廓 | 点部位落点；另设"不选部位"的纯文字入口 | 研究建议：方向（正面还是背面）要一眼看清；可点区域要比画出来的形状更大 |

## 归纳出的三种做法

1. **人体即首页（3D）**：打开就是一个可旋转的人体，直接在身上点。Complete Anatomy 的模型视图、MuscleMap Fitness 是这一类。优点是直观、有冲击力；缺点是 3D 模型更重，误触风险更高。
2. **人体即首页（2D 正反面图）**：MuscleWiki、症状记录类应用。最快、最不容易点错、对低端手机最友好；缺点是观感偏工具化，和后面的 3D 是两种视觉语言。
3. **菜单即首页**：Visible Body、国内解剖应用，先选部位或系统，再进 3D。适合内容很多的专业工具；对普通攀岩者来说多了一步，也不够直观。

## 反复出现的经验

- **层级越深越容易迷路**，手机上应比电脑更浅（设计机构的综述引用 Nielsen Norman Group 的观点，原报告收费未读到）。
- 有二手资料建议：**结构不深的手机应用不必用"面包屑"**（顶部那条"左手 › 中指 › A1 滑车"的路径），一个清楚的返回按钮加当前位置标题就够。
- **一键复位**很重要：Complete Anatomy 的 Home 按钮让模型随时回到初始姿态。
- **返回按钮要大、要好点**：Visible Body 因为返回箭头太小被批评。
- **分区不能太粗**：MuscleWiki 因胸、背各只有一块被批评，第二层必须能细到具体结构。
- **永远留一个不用人体图的入口**（搜索或列表），给找不到位置或不方便操作 3D 的人用。
- 人体图要一眼看出朝向；可点区域要比画出来的形状大。

## 对我们的启发与推荐

**推荐：3D 全身概览 → 部位 → 结构，最多三层。**

| 层 | 看到什么 | 点一下 | 返回 |
|---|---|---|---|
| 1 全身 | 一个可旋转的全身人体。已有内容的部位（第一版：手、前臂、肩）用强调色，其余为灰色 | 点亮色部位：镜头飞进该部位，进入第 2 层。点灰色部位：提示"该部位内容整理中" | 无 |
| 2 部位 | 例如左手的完整解剖：骨骼、肌腱、滑车等，可开关图层 | 点结构：直接选中，底部卡片显示名称与相关内容；镜头可轻推近，但不算新的一层 | 左上角"‹ 全身"大按钮 |
| 3 结构 | 结构高亮，卡片里链接到相关损伤与动作 | 进入损伤或动作详情（属于另外的标签页） | 关闭卡片 |

理由：

- 符合负责人最初的设想，也是 3D 解剖类产品的主流做法。
- 从全身飞进部位的镜头动画能让人知道"我在身体哪里"，比切换页面更不容易迷路。
- 三层就够：之前设计里"手 → 手指 → 结构"的中间一层可以去掉，点结构时镜头自动推近即可。
- 层级浅，所以**建议去掉面包屑**，改为一个醒目的返回按钮加当前部位名称，并保留一键复位。
- **左右手由点的位置决定**：在全身上点左手就进入左手，更直接。部位页里仍保留右上角的左右开关，方便不返回就切换。这是对负责人方案的修改建议。
- 全身上的灰色部位如实告诉用户"还有哪些在路上"，比只显示一只胳膊更完整。

## 需要先解决的问题

1. **全身模型用什么外观。** 数据集里有完整的皮肤网格，但它包含生殖器等细节，不适合运动类应用，也可能影响应用商店的年龄分级。可选：
   - 用骨骼加浅层肌肉做全身轮廓（与 3D 解剖类应用观感一致，推荐）；
   - 另找可商用的中性人体模型（需要确认授权）；
   - 对皮肤模型做简化处理（工作量与效果不确定）。
   概念预览见 `2026-11-22-overview-concept-skin.png`（用皮肤网格粗略生成，部位划分很粗糙，仅示意）。
2. **性能。** 全身概览按部位合并网格后约 10 次绘制、几万个三角面，开销不大；进入部位时再加载该部位的精细模型。需要真机验证。
3. **第一版大部分部位是灰色的。** 这是如实呈现，但也可能让人觉得"内容很少"。备选是全身概览只把上半身做成可点的。

## 备选方案

- **2D 正反面人体图作首页**：最快最稳，适合低端手机；观感偏工具化，且与后面的 3D 是两种风格。如果真机测试发现全身 3D 太卡，这是退路。
- **菜单作首页**（按部位列表）：最简单，但不直观，不推荐作为首页；可作为"列表"入口一直保留。

## 来源

- Complete Anatomy 使用指南：[华盛顿州立大学](https://tech.medicine.wsu.edu/technology/complete-anatomy/complete-anatomy-basics/)、[西奈山医学院](https://libguides.mssm.edu/virtualanatomyguide/completeanatomy)、[App Store 用户评论](https://apps.apple.com/au/app/complete-anatomy-for-ipad/id1054948424)
- Visible Body：[官方帮助（iPad）](https://help.cengage.com/visible-body/student/visible-body/atlas-getting-started-ipad.html)、[评测论文 PMC8554937](https://pmc.ncbi.nlm.nih.gov/articles/PMC8554937)
- BioDigital：[2020 导航更新说明](https://support.biodigital.com/hc/en-us/articles/360059954133-November-2020-Streamlined-navigation-in-the-Human-Viewer)、[Carepatron 汇总](https://www.carepatron.com/app/anatomy-app)
- 国内应用：[万康人体解剖 App Store](https://apps.apple.com/cn/app/id6480260145)、[掌上3D解剖 App Store](https://apps.apple.com/ly/app/%E6%8E%8C%E4%B8%8A3d%E8%A7%A3%E5%89%96/id1644056187)
- Muscle & Motion：[App Store](https://apps.apple.com/us/app/id1302056349)
- MuscleWiki 与同类：[MuscleWiki App Store](https://apps.apple.com/us/app/-/id1096827640)、[MuscleMap Fitness](https://apps.apple.com/app/id6782176731)
- 人体图设计经验：[Infermedica：症状检查中的人体图](https://infermedica.com/blog/articles/the-role-of-body-avatars-in-symptom-checkers-and-how-to-work-with-them)、[Nourish 人体图](https://neil-white-fnjc.squarespace.com/nourish-bodymap)、[人体图可用性研究 JMIR mHealth 2018](https://mhealth.jmir.org/2018/5/e127/PDF)
- 导航层级：[印第安纳大学 UX 指南](https://ux.iu.edu/articles/navigation-and-architecture/index.html)、[波士顿大学](https://wpdocs.bu.edu/cds/cds/glossary/information-architecture/)、[IxDF](https://ixdf.org/literature/article/the-heart-of-the-matter-information-architecture-in-the-mobile-age)、[NN/g 移动导航模式](https://www.nngroup.com/articles/mobile-navigation-patterns/)
