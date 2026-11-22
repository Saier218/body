import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', 'node_modules/**', 'android/**', 'ios/**', 'docs/**', 'data/**', 'apps/app/public/**', 'apps/miniprogram/libs/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['tools/**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // Mini programs load the shared libraries as CommonJS modules.
    files: ['apps/miniprogram/**/*.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // The 3D core must stay platform-independent (CLAUDE.md 6.4): no browser, native or mini-program globals.
    files: ['packages/viewer-core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'navigator',
        'self',
        'wx',
        'fetch',
        'performance',
        'localStorage',
        'requestAnimationFrame',
      ],
    },
  },
);
