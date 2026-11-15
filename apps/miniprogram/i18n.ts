/** All interface text goes through this table; pages never hard-code a language. */
export type Lang = 'zh' | 'en';

const TEXT = {
  loading: { zh: '正在加载模型…', en: 'Loading model…' },
  ready: { zh: '点一下任意结构', en: 'Tap any structure' },
  back: { zh: '返回全貌', en: 'Back to overview' },
  benchmark: { zh: '跑性能测试', en: 'Run benchmark' },
  benchmarking: { zh: '测试中…', en: 'Measuring…' },
  lang: { zh: 'English', en: '中文' },
  diagnostics: { zh: '诊断信息（请截图发回）', en: 'Diagnostics (please screenshot)' },
  group: { zh: '所在分区', en: 'Region' },
  noZh: { zh: '（中文名待补）', en: '' },
  incidence: { zh: '文献出现率', en: 'Reported incidence' },
  err_webgl2: { zh: '此设备或基础库不支持 WebGL2，无法渲染。', en: 'WebGL2 is not available on this device or base library.' },
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
  const entry = (TEXT as Record<string, { zh: string; en: string }>)[prefix + '_' + name];
  return entry ? entry[lang] : name;
}
