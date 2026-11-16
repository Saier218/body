/** All interface text goes through this table; screens never hard-code a language. */
export type Lang = 'zh' | 'en';

const TEXT = {
  loading: { zh: '正在加载模型…', en: 'Loading model…' },
  ready: { zh: '点一下任意结构', en: 'Tap any structure' },
  back: { zh: '返回全貌', en: 'Back to overview' },
  benchmark: { zh: '跑性能测试', en: 'Run benchmark' },
  benchmarking: { zh: '测试中…', en: 'Measuring…' },
  lang: { zh: 'English', en: '中文' },
  diagnostics: { zh: '诊断信息', en: 'Diagnostics' },
  group: { zh: '所在分区', en: 'Region' },
  incidence: { zh: '文献出现率', en: 'Reported incidence' },
  err_webgl2: {
    zh: '此设备不支持 WebGL2，无法显示 3D 模型。',
    en: 'This device does not support WebGL2, so the 3D model cannot be shown.',
  },
  err_load: { zh: '模型加载失败', en: 'The model failed to load' },
  credit: {
    zh: '解剖底模：BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
    en: 'Base anatomy: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
  },
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
