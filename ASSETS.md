# 第三方资产台账

任何第三方素材或依赖进入仓库前先在此登记（规则见 `CLAUDE.md` 第 4 节）。未登记不得提交。

| 资产 | 用途 | 来源链接 | 作者 / 权利人 | 协议 | 可商用 | 署名要求 | 传染性（SA / copyleft） | 取得日期 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| BodyParts3D 4.0（`isa_BP3D_4.0_obj_99.zip`） | 3D 解剖底模 | https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/ | The Database Center for Life Science (DBCLS) | CC BY 4.0 | 是 | "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International" | 无 | 2026-11-13 | sha256 `40665852…7cd409e`。原始压缩包不入库。文件头注释仍为旧协议，见决策记录 0001 |
| three.js 0.170.0 | 3D 渲染（目前仅用于本地预览） | https://github.com/mrdoob/three.js | three.js authors | MIT | 是 | 保留版权声明 | 无 | 2026-11-13 | |
| trimesh、numpy、scipy、shapely、networkx | 建模脚本依赖，不随产品分发 | PyPI | 各自作者 | MIT / BSD | 是 | 不分发则无 | 无 | 2026-11-13 | 若日后分发须逐个复核协议 |
