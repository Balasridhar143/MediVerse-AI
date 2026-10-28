import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { PushNotifications } from '@capacitor/push-notifications';
import { App as CapApp } from '@capacitor/app';
import { notificationService } from './api';

export const initializeMobileApp = async (navigate) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Native] Running in web browser environment.');
    return;
  }

  console.log('[Native] Initializing native Android platform capabilities...');

  // 1. Android Status Bar styling
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0d9488' });
  } catch (err) {
    console.warn('[Native] StatusBar initialization error:', err);
  }

  // 2. Android Back Button handling
  try {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
  } catch (err) {
    console.warn('[Native] Back button setup error:', err);
  }

  // 3. Android Push Notifications
  try {
    const permStatus = await PushNotifications.checkPermissions();
    let receive = permStatus.receive;

    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      const req = await PushNotifications.requestPermissions();
      receive = req.receive;
    }

    if (receive === 'granted') {
      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token) => {
        console.log('[Push] Device registration token:', token.value);
        try {
          await notificationService.registerDeviceToken(token.value, 'android');
        } catch (e) {
          console.warn('[Push] Failed to register token with backend:', e);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.warn('[Push] Error on registration:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Push notification received in foreground:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Notification action performed:', action);
        const data = action.notification.data;
        if (data && data.url && navigate) {
          navigate(data.url);
        } else if (navigate) {
          navigate('/patient/appointments');
        }
      });
    }
  } catch (err) {
    console.warn('[Push] Push notification initialization skipped or unavailable:', err);
  }
};
