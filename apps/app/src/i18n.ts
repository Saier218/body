/** React binding for the shared text table (packages/shared). */
import { createContext, useContext } from 'react';
import { t, tDynamic, type Lang, type TextKey } from '../../../packages/shared/src';

export { t, tDynamic };
export type { Lang, TextKey };

export const LangContext = createContext<Lang>('zh');

/** Returns a translator bound to the current language. */
export function useT(): { lang: Lang; t: (key: TextKey) => string; td: (prefix: 'kind' | 'group', name: string) => string } {
  const lang = useContext(LangContext);
  return { lang, t: (key) => t(key, lang), td: (prefix, name) => tDynamic(prefix, name, lang) };
}
