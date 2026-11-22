# 同类调研：动作库首页与动作详情页

- 日期：2026-11-23（检索于 2026-11-22 晚）
- 目的：设计"动作"标签——动作库怎么组织、动作详情页怎么呈现"用到哪些结构"和"哪里容易伤"
- 方法：10 次网络检索。读到的是应用商店介绍文字、官方帮助页、第三方教程、用户论坛帖子和攀岩术语科普页。**没有亲手试用任何一款 App，应用商店页面也无法直接打开**，下表中的界面描述多数来自开发者自己的宣传文字或第三方转述，不代表实际手感。表中"未找到"表示这次检索没有查到，不等于不存在。

## 看了谁

| 产品 | 类型 | 动作库怎么进入 | "用到哪些肌肉"怎么呈现 | 风险 / 注意事项怎么呈现 | 别人怎么评价 / 资料可信度 |
|---|---|---|---|---|---|
| Crimpd | 攀岩训练 | 应用商店评论提到"按若干类别拆分训练"，具体类别名未查到 | 未查到 | 未查到 | 只有评论里的零散描述，二手 |
| Lattice Training App | 攀岩训练 | 本次未检索到有效资料 | — | — | 无 |
| Kilter Board（及第三方 Boardsesh） | 训练板线路 | 按难度区间、是否完成过、板子角度筛选线路；第三方应用还可按岩点类型、板面区域筛选 | 不涉及 | 不涉及 | 论坛用户反映曾缺少按板型筛选；来源为商店页、岩馆博客、论坛 |
| 攀岩术语科普页（REI、Mammut、BMC 等） | 文章 | 岩点按"大把手 / 小边 / 圆点 / 捏点 / 洞"分类；抓法按"开手 → 半握 → 全握"排成一条递进链 | 不涉及 | 普遍用"开手对手指负担较小、全握负担较大"这类定性比较，不给数字 | 一次检索的结果，各页分组略有差异 |
| Muscle & Motion（Strength） | 运动解剖（3D 动画） | 约 1200+ 个动作，按肌群与训练类型浏览，也可搜索 | 多角度 3D 动画中按颜色区分主动肌、协同肌、稳定肌、拮抗肌 | 每个动作配"常见错误 / 该做与不该做"视频，宣传为"帮助避免受伤" | 全部来自开发者商店文案和被引用的好评；上一份调研中也有用户反映卡顿 |
| MuscleWiki | 健身动作库（2D 人体图） | 点人体图上的肌群，或按器械筛选 | 以"目标肌群"为入口，详情页有示范视频与动作要领 | 未查到 | 官方页面信息有限；上一份调研中用户批评分区太粗 |
| Fitbod | 健身动作库 | 1600+ 个动作，按肌群、器械、关键词搜索 | 区分"主要肌群"（主要承受负荷的一个）与"次要肌群"（协同支持）；相似动作按主要肌群匹配 | 未查到 | 来自官方 FAQ 与商店页 |
| Nike Training Club | 健身课程 | "浏览"页按肌群、训练重点、器械分组 | 只到"腹 / 手臂 / 腿"这种粗分组 | 未查到 | 第三方教程，可能过时 |
| Complete Anatomy（Motion 功能） | 专业解剖（3D） | 先选一块肌肉，信息框里出现"Motion"，再从列表中选一个动作播放 | 动画演示该肌肉参与的关节运动 | 不涉及 | 官方帮助页 |
| Visible Body（Muscle Actions） | 专业解剖（3D） | "肌肉动作"菜单，**按身体部位组织**动画 | 动画中高亮参与的肌肉 | 不涉及 | 官方帮助页 |
| Fitbit / Trainerize / TrainerRoad 等用户论坛 | 健身平台 | — | — | — | 大量帖子抱怨"只有分类没有搜索，找不到想要的"；也有人抱怨搜索只匹配名称、排序不准、筛选太少 |

## 归纳出的三种做法

1. **分类目录**（攀岩科普页、NTC 的"浏览"页）：按动作类型分组，分组名就是领域术语。优点：和攀岩者的说法一致，内容少时一屏能看完；缺点：不知道动作叫什么、只知道"哪里不舒服"的人不好找。
2. **按身体部位进入**（MuscleWiki、Visible Body 的肌肉动作、Fitbod 的肌群搜索）：先选部位，再列出用到该部位的动作。优点：贴近"我手指担心受伤"这类以部位出发的需求；缺点：一个动作往往跨多个部位，分区太粗会被批评（MuscleWiki 的教训）。
3. **多维筛选 + 搜索**（Fitbod、Kilter）：部位、器械、难度、角度等同时筛选。优点：内容多时效率高；缺点：内容少时筛完常常只剩一两个结果，筛选项本身变成负担。

几乎所有成熟的动作库都**同时**提供搜索，分类或筛选只是浏览入口。

## 反复出现的经验

- **搜索不能省**：论坛里反复出现"没有搜索就找不到"的抱怨；搜索还要能匹配别名和英文（如 crimp、半扣），不能只匹配正式名。
- **主次要分清**：Fitbod 只分"主要 / 次要"两级；Muscle & Motion 分四种角色并用颜色区分。我们的数据已有四种角色（主动肌、协同肌、稳定肌、受力的非收缩结构），界面上要让人一眼分辨，同时给出"这个角色是什么意思"的说明——普通攀岩者未必懂"协同肌"。
- **风险用定性比较，不用分数**：攀岩科普页普遍写"开手负担较小、全握负担较大"；Muscle & Motion 用"常见错误"的正面指导框架。没有看到可靠的产品用风险分数，这与我们"不给风险评分"的规定一致。
- **动作演示**：Muscle & Motion 和 Complete Anatomy 用 3D 动画，健身类应用多用视频或循环动图。**没有找到直接比较"循环动画 vs 视频"用户偏好的研究**；只查到教学设计领域的一般观点：动画让人不必在脑中想象各部分如何运动，认知负担较低（未读全文，二手）。对我们而言，自绘的简单示意图（静态或短循环）版权干净、体积小，可以先做静态，动画留到后面。
- **按部位组织动作有先例**：Visible Body 的肌肉动作按身体部位组织，和我们的"身体"标签思路一致。
- **筛选维度要和内容量匹配**：Kilter 这类上千条线路才需要多维筛选；我们第一版约 15 个动作。

## 对我们的启发与推荐

**推荐：分类目录为主（方案一），首页顶部常驻搜索；把"部位"做成可选的轻量筛选，而不是主结构。**

理由：

- 第一版只有约 15 个动作，按五个分类分组后一屏多一点就能看完，多维筛选在这个量级上收益很小。
- 分类名（抓握方式、身体姿态……）就是攀岩者的日常说法，也与 `content/sports.json` 和 `app-structure.md` 已定的结构一致，不需要改数据结构。
- "我手指担心受伤"这条以部位出发的路径，已经由"身体"标签（3D → 结构 → 相关动作）和"损伤"标签承担；动作标签不必再重复一遍。
- 负责人提出的"风格（静态 / 动态 / Dyno）"：调研里没有看到哪个产品把它作为动作库的第一层。而且它只适用于身体动作，不适用于抓法——同一个半握在静态和动态动作里都会用到。**建议不作为第一层**，可作为动作的一个属性或筛选条件（见方案二）。这与负责人的原始想法有出入，需要讨论。

## 备选方案

- **方案二：部位 × 风格筛选 + 姿势插图卡片**。更直观、更有"产品感"，也承接了负责人的风格想法；代价是需要给数据加"风格"字段（改 schema，需决策记录），每个动作要画一张示意图，且内容少时筛选结果很空。如果日后动作数量明显增长（几十个以上），可以从方案一平滑过渡到这种做法。
- **把风格作为第一层**（攀岩 → 静态 / 动态 / Dyno → 动作）：更贴近负责人的原话，但抓法、坠落、训练都无法归入这三类，会出现"其他"这种兜底分组，不推荐。

## 来源

- Crimpd：[App Store](https://apps.apple.com/us/app/crimpd/id1252333138)、[Google Play](https://play.google.com/store/apps/details?id=com.crimpd.ui)
- Kilter Board：[App Store](https://apps.apple.com/us/app/kilter-board/id1215919336)、[Gripped：如何使用 Kilter 板](https://gripped.com/indoor-climbing/how-to-use-a-kilter-board/)、[The Spot 岩馆博客](https://thespotgym.squarespace.com/blog/how-to-use-a-kilter-board)、[Mountain Project 论坛](https://www.mountainproject.com/forum/message/122324220)、[Boardsesh App Store](https://apps.apple.com/ch/app/boardsesh/id6761350784)
- 攀岩岩点与抓法术语：[REI](https://www.rei.com/learn/expert-advice/climbing-holds.html)、[Mammut](https://www.mammut.com/ie/en/stories-guides/what-types-of-climbing-and-bouldering-holds-are-there)、[BMC 攀岩用语](https://www.thebmc.co.uk/climbing-how-to-talk-the-talk)、[Wikipedia: Climbing hold](https://en.wikipedia.org/wiki/Climbing_hold)、[Mountain Training 术语表](https://www.mountain-training.org/help/resources/rock-climbing-glossary)
- Muscle & Motion：[App Store](https://apps.apple.com/us/app/id1302056349)、[官网：解剖与运动生物力学](https://www.muscleandmotion.com/anatomy-and-biomechanics-of-movement)
- MuscleWiki：[动作库](https://musclewiki.com/exercises)、[关于](https://musclewiki.com/about)、[第三方 API 说明（非官方）](https://parse.bot/marketplace/e04692ac-c769-422a-bfeb-0033257d0930/musclewiki-com-api)
- Fitbod：[动作页说明](https://fitbod.me/about-fitbod-exercises)、[App Store](https://apps.apple.com/ph/app/id1041517543?l=en-gb)
- Nike Training Club：[MakeUseOf 使用教程](https://www.makeuseof.com/how-use-nike-training-club-app-next-level-fitness/)、[官方介绍](https://www.nike.com/gb//ntc-app)
- 解剖应用的动作动画：[3D4Medical Motion 功能](https://3d4medical.com/?p=1854)、[Visible Body Muscle Actions 帮助](https://help.cengage.com/visible-body/instructor/visible-body/atlas-muscle-actions-ipad.html)
- 动作演示形式（未读到全文）：[动画与真人视频示范对比（肯塔基大学论文摘要）](https://uknowledge.uky.edu/edsrc_etds/150)、[AR、视频与图片的运动学习对比 arXiv 2209.02161](https://arxiv.org/pdf/2209.02161)
- 动作库搜索与分类的用户抱怨：[Fitbit 社区：请求搜索栏](https://community.fitbit.com/t5/Product-Feedback/Search-bar-to-find-workouts-recipes-and-mindfulness-sessions/idi-p/4901061/page/3)、[Trainerize 建议：优化搜索](https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/42630025-optimize-search-keywords-for-workout-library)、[Trainerize 建议：更多筛选](https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/47657348-more-filters-search-options-for-workout-library)、[TrainerRoad 论坛](https://www.trainerroad.com/forum/t/feature-request-search-workout-text/10401)
