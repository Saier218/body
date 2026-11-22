/** Me tab: language, about and credits, diagnostics. Mirrors apps/app/src/screens/MeScreen.tsx. */
import { navBarStyle } from '../../utils/layout';
import { store, subscribe } from '../../utils/store';
import { applyTabLabels } from '../../utils/tabbar';
import { t } from '../../utils/text';
import type { Lang, TextKey } from '../../utils/text';

/** Each language is offered under its own name, so these two labels are deliberately not translated. */
const LANGS: { id: Lang; label: string }[] = [
  { id: 'zh', label: '中文' },
  { id: 'en', label: 'English' },
];

Page({
  data: {
    navStyle: '',
    lang: 'zh' as Lang,
    langs: LANGS,
    tx: {} as Record<string, string>,
    benchLabel: '',
    benchmarking: false,
    diagText: '',
  },

  onLoad(): void {
    this.setData({ navStyle: navBarStyle() });
    subscribe(() => this.render());
  },

  onShow(): void {
    applyTabLabels(store().lang);
    this.render();
  },

  render(): void {
    const g = store();
    const l = g.lang;
    const tr = (key: TextKey) => t(key, l);
    this.setData({
      lang: l,
      tx: {
        title: tr('tab_me'),
        language: tr('me_language'),
        about: tr('me_about'),
        disclaimer: tr('me_disclaimer'),
        mirror: tr('me_mirror'),
        pulleys: tr('me_pulleys'),
        credit: tr('me_credit'),
        diag: tr('me_diag'),
        diagHint: tr('me_diag_hint'),
      },
      benchLabel: tr(g.benchmarking ? 'benchmarking' : 'bench_run'),
      benchmarking: g.benchmarking,
      diagText: g.diag.join('\n'),
    });
  },

  onLang(ev: WechatMiniprogram.TouchEvent): void {
    const l = String(ev.currentTarget.dataset.lang) === 'en' ? 'en' : 'zh';
    store().lang = l;
    applyTabLabels(l);
    this.render();
  },

  /** Like the app: the test returns to the Body tab and spins the model there for about 4 seconds. */
  onBenchmark(): void {
    const g = store();
    if (g.benchmarking) return;
    g.benchmarking = true;
    g.benchPending = true;
    this.render();
    wx.switchTab({
      url: '/pages/body/body',
      fail: (err) => {
        g.benchPending = false;
        g.benchmarking = false;
        g.diag.push('ERROR switchTab: ' + err.errMsg);
        this.render();
      },
    });
  },
});
