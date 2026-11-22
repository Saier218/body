/** Injuries tab: placeholder until reviewed entries exist. Mirrors apps/app/src/screens/Placeholder.tsx. */
import { navBarStyle } from '../../utils/layout';
import { store } from '../../utils/store';
import { applyTabLabels } from '../../utils/tabbar';
import { t } from '../../utils/text';

Page({
  data: {
    navStyle: '',
    title: '',
    body: '',
  },

  onLoad(): void {
    this.setData({ navStyle: navBarStyle() });
  },

  onShow(): void {
    const lang = store().lang;
    applyTabLabels(lang);
    this.setData({ title: t('placeholder_injuries', lang), body: t('placeholder_body', lang) });
  },
});
