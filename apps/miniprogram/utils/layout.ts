/**
 * The pages draw their own top bar (navigationStyle: custom). WeChat's capsule menu button
 * always floats at the top right, so the bar lines up with it and leaves room for it.
 */
export function navBarStyle(): string {
  let top = 20;
  let height = 44;
  let right = 96;
  try {
    const win = wx.getWindowInfo();
    const btn = wx.getMenuButtonBoundingClientRect();
    if (win.statusBarHeight) top = win.statusBarHeight;
    if (btn && btn.height && btn.left) {
      height = Math.max(44, (btn.top - top) * 2 + btn.height);
      right = Math.max(16, win.windowWidth - btn.left + 8);
    }
  } catch {
    // keep the defaults
  }
  return 'padding-top:' + top + 'px;height:' + (top + height) + 'px;padding-right:' + right + 'px;';
}
