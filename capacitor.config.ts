import type { CapacitorConfig } from '@capacitor/cli';

// appId and appName are placeholders. The appId becomes the permanent store identity of the app
// (iOS bundle ID / Android application ID); set the real one before the first store submission.
const config: CapacitorConfig = {
  appId: 'com.placeholder.body',
  appName: 'body',
  webDir: 'apps/app/dist',
};

export default config;
