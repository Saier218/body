# 同类调研：损伤标签首页与"哪里不舒服"入口

- 日期：2026-11-23（检索于 2026-11-22 晚）
- 目的：决定"损伤"标签首页怎么组织，以及用户带着不适进来时，怎样按身体部位找到相关条目，同时不越界成为症状自测工具
- 方法：10 次网络检索，读到的是检索结果摘要、应用商店介绍、官方说明页和法规指南的摘要。另尝试直接打开 OrthoInfo 与一篇 BJSM 应用评测原文，因当前环境网络限制未能打开。**没有亲手试用任何一款产品**，下表中的界面描述多为二手信息，以文字为准，不代表实际手感。
- 与上一份调研的关系：`2026-11-22-entry-and-navigation.md` 已经整理过人体图（正反面、可点区域要大于画出来的形状）的经验，这里不重复，只补充"损伤内容怎么按部位浏览"和"安全边界怎么表达"。

## 看了谁

| 产品 | 类型 | 怎么按部位找内容 | 怎么表达安全边界 | 备注（来源质量） |
|---|---|---|---|---|
| NHS 健康 A–Z（英国） | 公共健康百科 | 按字母排列的病症、症状、检查与处理三套 A–Z，加站内搜索；检索中**没有找到按身体部位的索引** | 每个条目有"什么时候寻求帮助"的固定段落 | 官方页面，可信；"无部位索引"是检索未见，不是确认 |
| OrthoInfo（美国骨科医师学会） | 专业学会的患者科普 | 顶部菜单"按身体部位"：颈、背、肩、肘、手与腕、髋与大腿、膝与小腿、足与踝；另有"运动损伤"等热门主题 | 未能打开原站核实 | 菜单结构来自检索摘要，原站因网络限制未读到 |
| Sportsinjuryclinic.net 及其应用 | 运动损伤科普网站与康复应用 | 一篇期刊评测称其"运动损伤"栏目按身体部位整理，网站可点身体区域进入；每条讲表现、可能机制和处理建议 | 康复应用写明"仅供信息参考，请咨询医生" | 评测原文未读到，只有摘要；评测指出"找诊所"功能失效 |
| FixitDoc | 运动医学医生编写的损伤资料库应用 | 240 多个损伤资料文件，涵盖肌肉、关节、肌腱、韧带 | 未见具体描述 | 应用商店介绍 |
| My Injury | 损伤资料应用 | 每条：描述、原因、表现、恢复时间、减少加重的建议 | 未见 | 应用商店介绍，描述偏营销 |
| Injurymap | 康复训练应用 | 先选要处理的身体部位，再进入**评估问卷** | — | 这正是我们不做的"选部位 → 问答 → 给结果"路径 |
| Recovery Blueprint、Rock Rehab（攀岩） | 攀岩手指康复课程 | 按损伤类型和手指组织；Recovery Blueprint 提供"免费损伤评估工具"；Rock Rehab 按严重程度分路径，中度以上要求先咨询医生 | 商家页面注明案例不代表同样效果 | 商业页面，无独立评测；**没有找到专门的攀岩损伤"资料库"应用** |
| Mayo Clinic 症状检查 | 症状自测（反例） | 先选常见不适（如足痛、头痛），再选相关因素，缩小到可能原因 | 自称"帮你缩小搜索范围的工具"，并说明可靠的做法是去看医生 | 官方说明页 |
| healthdirect 症状检查（澳大利亚） | 公共症状自测（反例） | 问答式 | 首屏有"紧急情况请拨 000"横幅；说明不能替代专业人员 | 官方说明页；体图细节未检索到 |

## 归纳出的三种组织方式

1. **按部位的目录**（OrthoInfo、Sportsinjuryclinic）：部位 → 该部位的条目列表 → 条目。本质是一本书的目录，不对用户的情况做任何推断。这是我们可以采用的方式。
2. **按字母或搜索**（NHS A–Z）：适合已经知道名字的人。名字不熟时不友好，但作为补充入口几乎是标配。
3. **按部位进入问答**（Injurymap、Mayo、healthdirect、Recovery Blueprint 的评估工具）：选部位后继续追问，末了给出可能的原因或分流建议。这是症状自测，**我们不做**。

## 为什么要守住"不做症状自测"这条边界

- **准确性有限。** BMJ 2015 年的审计研究测试了 23 款免费症状检查工具：把正确结果排在首位的只占 34%，分流建议恰当的占 57%；2020 年用同样案例复测，分流准确率中位数约 56%，几乎没有进步。
- **在国外会被当成医疗器械监管。** 英国药监机构（MHRA）的软件指南把症状检查列为医疗器械，"允许直接得出结论"的升为 IIa 类；指南还写明，**按危险信号、严重程度或匹配概率对结果做筛选或排序的软件，可能属于医疗器械**。欧盟 MDR 下也有类似分级讨论（来自论文，二手）。美国 FDA 2026 年 1 月更新的临床决策支持指南强调，面向患者的软件只要符合器械定义，现有政策同样适用。
- **在中国，判断标准是"预期用途"。** 国家药监局的人工智能医用软件分类界定指导原则以预期用途为基础，结合处理对象和核心功能综合判定；存疑的产品可以申请分类界定。检索**没有找到**专门针对"健康科普 App"的结论，属于未核实，上线前应请专业人士确认。
- **对我们的直接启示：** 列表的**排序方式**也是边界的一部分。若按"可能性"或"严重程度"给用户排序，即使没有问卷，也接近 MHRA 所说的"筛选排序"。所以结果列表只按固定规则（名称或编辑顺序）排列，并在页面上写明。

## 反复出现的经验

- 专业学会和公共健康网站都用**部位或字母目录**来组织科普内容，不追问个人情况。
- 安全边界的表达有两种：**全站固定**（healthdirect 的急救横幅）和**每条内容里固定段落**（NHS 的"什么时候寻求帮助"）。两者叠加更稳。
- 症状自测工具自己也反复声明"不能替代医生"，但声明本身不改变它的性质；监管看的是**功能做了什么**，不是免责声明怎么写。
- 攀岩领域现有的产品以付费康复课程为主，常带"评估工具"。一个只讲文献、明确不做评估的资料库，目前检索中没有看到直接对手（未穷尽检索）。
- 部位要能细分：攀岩者的不适多集中在手指、手腕、前臂与肘、肩，单一"手"分区太粗（与上一份调研里 MuscleWiki 分区太粗的批评一致）。

## 对我们的启发与推荐

**推荐：方案一"部位目录"作为损伤标签首页的主结构；方案二中的"攀岩情境"只作为次要入口观察，暂不上首页。**

| 要素 | 做法 | 理由 |
|---|---|---|
| 首页主体 | 小号 2D 人体（正面 / 背面）加右侧部位列表，两者等价 | 目录式浏览是专业学会的通行做法；列表保证 3D 与图形之外有等价入口（准则 6.9） |
| 部位粒度 | 手指、手掌与手腕、前臂与肘、肩；其余灰色"整理中" | 与决策 0011 的亮色部位一致，又比"手"一个分区细 |
| 搜索 | 只检索条目名称、别名、结构名（中英文与拉丁名） | 搜索不解析症状描述，避免变成"输入症状得结论" |
| 结果列表 | 标题写"文献中常见于该部位的损伤"；按名称排序并注明"不按可能性排序" | 排序方式本身不能暗示判断 |
| 安全提示 | 首页和结果页都有"什么时候应该尽快就医"卡片；底部固定免责声明 | 两层叠加，与 NHS 和 healthdirect 的做法一致 |
| 状态徽标 | 每行显示"已对照来源 · 审阅日期" | 准则 5.3，界面如实显示状态 |

## 备选方案

- **方案二"攀岩情境入口"**：按"手指在小点上受力时 / 摔落与落地 / 肩部过顶动作 / 长期训练之后"进入。贴近攀岩者的说法，有特色；但与"动作"标签的分类（抓握方式、坠落与落地、专项训练等）重叠，且"情境 → 损伤"的分组需要每条都有文献支撑，内容成本更高。若用户访谈发现攀岩者更习惯按情境回忆，可以再提。
- **纯 A–Z 列表加搜索**（NHS 式）：实现成本低，但对"知道哪里不舒服、不知道叫什么"的用户不友好。可作为首页底部"全部损伤"入口保留。

## 来源

- NHS：[健康 A–Z](https://www.nhs.uk/health-a-to-z/)、[病症 A–Z](https://www.nhs.uk/conditions/)、[NHS 设计手册 A–Z 页面模式](https://service-manual.nhs.uk/design-example/patterns/a-to-z-page/default)
- OrthoInfo（美国骨科医师学会）：[首页](https://orthoinfo.aaos.org/)、[OrthoInfo 搜索页](https://www.orthoinfo.org/search/?q=Elbow)（菜单结构来自检索摘要，原站未能打开）
- 运动损伤资料类应用：[Sportsinjuryclinic.net](https://www.sportsinjuryclinic.net)、[BJSM 应用评测（伯恩茅斯大学存档）](https://eprints.bournemouth.ac.uk/30435/3/BJSM%20Sports%20injury%20clinic%20App%20review.pdf)、[Sports Injury Rehabilitation](https://apps.apple.com/us/app/-/id1538404666)、[FixitDoc](https://apps.apple.com/us/app/fixitdoc/id1615319577)、[My Injury](https://apps.apple.com/us/app/my-injury/id719359055)、[Injurymap](https://apps.apple.com/gb/app/injurymap/id1102375789)
- 攀岩康复课程：[Recovery Blueprint](https://kazoo-green-p7nb.squarespace.com/recoveryblueprint)、[The Climbing Doctor 滑车康复](https://theclimbingdoctor.com/portfolio-items/pulley-sprain-rehabilitation-program/)、[TrainingBeta 滑车文章](https://www.trainingbeta.com/pulley-diagnosis-rehab/)
- 症状自测工具：[Mayo Clinic 症状检查说明](https://www.mayoclinic.org/about-this-site/about-symptom-checker)、[healthdirect 症状检查说明](https://www.healthdirect.gov.au/about-healthdirect-symptom-checker)
- 准确性研究：[Semigran 等，BMJ 2015（哈佛存档）](https://dash.harvard.edu/handle/1/17820908)、[AHRQ PSNet 摘要](https://psnet.ahrq.gov/issue/evaluation-symptom-checkers-self-diagnosis-and-triage-audit-study)、[2020 年复测（PMC9131144）](https://pmc.ncbi.nlm.nih.gov/articles/PMC9131144/)
- 监管：[MHRA 医疗器械软件与应用](https://www.gov.uk/government/publications/medical-devices-software-applications-apps)、[MHRA 附录 1：症状检查](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1103566/Appendix_1_-_symptom_checkers.pdf)、[欧盟 MDR 下的症状检查分级（坦佩雷大学论文）](https://trepo.tuni.fi/bitstream/10024/143766/1/SHTI_295_SHTI220652_1.pdf)、[FDA 临床决策支持软件指南](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software)、[国家药监局分类界定相关文件](https://www.nmpa.gov.cn/directory/web/nmpa/images/1695029130281087655.docx)、[《关于进一步加强医疗器械产品分类界定有关工作的通知》征求意见稿报道](https://www.cn-healthcare.com/article/20230920/content-581817.html)

以上法规信息均为检索摘要层面的理解，执行前须对照官方当前文本重新核实（准则 1.3）。
