import type { AppOption } from './utils/store';
import type { Lang } from './utils/text';

function systemLang(): Lang {
  try {
    return wx.getAppBaseInfo().language.toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  } catch {
    return 'zh';
  }
}

App<AppOption>({
  globalData: {
    lang: systemLang(),
    diag: [],
    benchPending: false,
    benchmarking: false,
  },
});
