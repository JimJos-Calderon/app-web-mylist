import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jimjos.myapp',
  appName: 'app-web-jimjos',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0b0b12",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
    },
  },
};

export default config;
