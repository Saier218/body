/** The native tab bar has fixed labels in app.json; every tab page relabels it in the current language. */
import { t } from './text';
import type { Lang, TextKey } from './text';

const TAB_KEYS: TextKey[] = ['tab_body', 'tab_moves', 'tab_injuries', 'tab_me'];

export function applyTabLabels(lang: Lang): void {
  TAB_KEYS.forEach((key, index) => {
    wx.setTabBarItem({ index, text: t(key, lang), fail: () => {} });
  });
}
