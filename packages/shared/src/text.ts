/** Interface text for every shell (app and mini program). Screens never hard-code a language. */
export type Lang = 'zh' | 'en';

export const TEXT = {
  tab_body: { zh: '身体', en: 'Body' },
  tab_moves: { zh: '动作', en: 'Moves' },
  tab_injuries: { zh: '损伤', en: 'Injuries' },
  tab_me: { zh: '我的', en: 'Me' },
  nav_main: { zh: '主导航', en: 'Main navigation' },
  side_switch: { zh: '显示右侧', en: 'Show right side' },
  side_word_left: { zh: '左', en: 'Left' },
  side_word_right: { zh: '右', en: 'Right' },
  body_title: { zh: '全身', en: 'Body' },
  back_body: { zh: '全身', en: 'Body' },
  back_body_label: { zh: '返回全身', en: 'Back to the whole body' },
  reset_view: { zh: '复位', en: 'Reset view' },
  ov_hint: { zh: '点亮色部位进入', en: 'Tap a highlighted region' },
  ov_legend: { zh: '亮色：已有内容 · 灰色：整理中', en: 'Highlighted: available · Grey: in preparation' },
  region_pending: { zh: '该部位的内容正在整理中', en: 'Content for this region is in preparation' },
  status_pending: { zh: '整理中', en: 'In preparation' },
  list_regions: { zh: '身体部位', en: 'Body regions' },
  side_left: { zh: '左', en: 'L' },
  side_right: { zh: '右', en: 'R' },
  layers: { zh: '显示图层', en: 'Layers' },
  list_view: { zh: '列表', en: 'List' },
  list_title: { zh: '当前范围内的结构', en: 'Structures in view' },
  list_hidden_layer: { zh: '图层已隐藏', en: 'layer hidden' },
  close: { zh: '关闭', en: 'Close' },
  hint_title: { zh: '点一下任意结构', en: 'Tap any structure' },
  hint_gestures: { zh: '单指旋转 · 双指缩放和平移', en: 'One finger rotates · two fingers zoom and pan' },
  loading: { zh: '正在加载模型…', en: 'Loading model…' },
  err_webgl2: {
    zh: '此设备不支持 WebGL2，无法显示 3D 模型。',
    en: 'This device does not support WebGL2, so the 3D model cannot be shown.',
  },
  err_load: { zh: '模型加载失败', en: 'The model failed to load' },
  region: { zh: '所在分区', en: 'Region' },
  incidence: { zh: '文献出现率', en: 'Reported incidence' },
  related_injuries: { zh: '相关损伤', en: 'Related injuries' },
  related_moves: { zh: '相关动作', en: 'Related moves' },
  credit_short: { zh: '模型：BodyParts3D © DBCLS，CC BY 4.0', en: 'Model: BodyParts3D © DBCLS, CC BY 4.0' },
  placeholder_moves: { zh: '动作库', en: 'Moves' },
  placeholder_injuries: { zh: '损伤', en: 'Injuries' },
  placeholder_body: {
    zh: '内容正在对照文献整理，首批条目经人工审阅后上线。',
    en: 'Entries are being written against the literature and will appear once a person has reviewed them.',
  },
  me_language: { zh: '语言', en: 'Language' },
  me_about: { zh: '关于与致谢', en: 'About and credits' },
  me_disclaimer: {
    zh: '本内容为运动科普，不能替代医生的面诊与判断。',
    en: 'This is sports education and cannot replace an in-person assessment by a doctor.',
  },
  me_credit: {
    zh: '解剖底模：BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
    en: 'Base anatomy: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
  },
  me_mirror: {
    zh: '左手模型是右手模型的镜像，两侧结构完全对称；真实人体两侧会有细微差异。',
    en: 'The left hand is a mirror image of the right-hand model, so both sides are identical; real bodies differ slightly between sides.',
  },
  me_pulleys: {
    zh: '滑车由本项目依据解剖文献的测量数据建模，位置为推算，尚待专业人士确认。',
    en: 'The pulleys were modelled by this project from published measurements; their positions are derived and await professional review.',
  },
  me_diag: { zh: '运行信息与性能测试', en: 'Device info and benchmark' },
  me_diag_hint: {
    zh: '测试时会回到身体页并旋转模型约 4 秒。',
    en: 'The test returns to the Body tab and spins the model for about 4 seconds.',
  },
  bench_run: { zh: '运行性能测试', en: 'Run benchmark' },
  benchmarking: { zh: '测试中…', en: 'Measuring…' },
  kind_bone: { zh: '骨骼', en: 'Bones' },
  kind_muscle: { zh: '肌肉与肌腱', en: 'Muscles & tendons' },
  kind_fascia: { zh: '筋膜', en: 'Fascia' },
  kind_pulley: { zh: '滑车', en: 'Pulleys' },
  group_thumb: { zh: '拇指', en: 'Thumb' },
  group_index: { zh: '食指', en: 'Index finger' },
  group_middle: { zh: '中指', en: 'Middle finger' },
  group_ring: { zh: '环指', en: 'Ring finger' },
  group_little: { zh: '小指', en: 'Little finger' },
  group_wrist: { zh: '腕部', en: 'Wrist' },
  group_palm: { zh: '手掌', en: 'Palm' },
  group_forearm: { zh: '前臂', en: 'Forearm' },
} as const;

export type TextKey = keyof typeof TEXT;

export function t(key: TextKey, lang: Lang): string {
  return TEXT[key][lang];
}

export function tDynamic(prefix: 'kind' | 'group', name: string, lang: Lang): string {
  const entry = (TEXT as Record<string, { zh: string; en: string }>)[`${prefix}_${name}`];
  return entry ? entry[lang] : name;
}
