/** Interface text. The table lives in packages/shared and is built into libs/shared.js (decision 0012). */
import type * as Shared from '../../../packages/shared/src/text';

const shared = require('../libs/shared.js') as typeof Shared;

export type Lang = Shared.Lang;
export type TextKey = Shared.TextKey;

export function t(key: TextKey, lang: Lang): string {
  return shared.t(key, lang);
}

export function tDynamic(prefix: 'kind' | 'group', name: string, lang: Lang): string {
  return shared.tDynamic(prefix, name, lang);
}
