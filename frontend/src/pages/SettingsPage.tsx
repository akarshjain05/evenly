import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUIStore } from '../store/uiStore';
import { apiClient } from '../api/client';
import { Moon, Bell, LogOut } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const { showAlert, showConfirm } = useUIStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    if ('Notification' in window) {
      setIsNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleDarkMode = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  const toggleNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      showAlert('Error', 'Push notifications are not supported in this browser.');
      return;
    }

    if (isNotificationsEnabled) {
      // Optimistically turn off
      setIsNotificationsEnabled(false);
      setIsSubscribing(true);
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      } catch (err: any) {
        setIsNotificationsEnabled(true); // Revert on failure
        showAlert('Error', 'Failed to disable notifications: ' + err.message);
      } finally {
        setIsSubscribing(false);
      }
      return;
    }

    // Optimistically turn on
    setIsNotificationsEnabled(true);
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setIsNotificationsEnabled(false); // Revert
        setIsSubscribing(false);
        showAlert('Error', 'Notification permission was denied.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const { data } = await apiClient.get<{ public_key: string | null }>('notifications/vapid-public');
      
      if (!data.public_key) {
        setIsNotificationsEnabled(false); // Revert
        setIsSubscribing(false);
        showAlert('Error', 'Push notifications are not configured on the server.');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.public_key)
      });
      
      const subJson = subscription.toJSON();
      await apiClient.post('notifications/subscribe', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth
      });
      // Removed the success popup to keep the UX instantly responsive
    } catch (err: any) {
      setIsNotificationsEnabled(false); // Revert on failure
      showAlert('Error', 'Failed to enable notifications: ' + err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-ink m-0 mb-2">Personal Settings</h1>
        <p className="text-[15px] text-ink-soft m-0">Manage your preferences and account.</p>
      </div>
      
      <div className="bg-paper rounded-2xl border border-line-dark overflow-hidden flex flex-col mb-8 shadow-sm">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line-dark gap-4 hover:bg-bg transition-colors">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center shrink-0 border border-line-dark">
              <Moon className="text-ink" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[15px] text-ink">Dark Mode</div>
              <div className="text-[13px] text-ink-soft mt-0.5 leading-snug">Toggle dark theme appearance</div>
            </div>
          </div>
          <button 
            onClick={toggleDarkMode}
            className={`shrink-0 w-12 h-6 rounded-full transition-colors relative cursor-pointer border-none ${isDarkMode ? 'bg-primary' : 'bg-[#D0D0D0]'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line-dark gap-4 hover:bg-bg transition-colors">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center shrink-0 border border-line-dark">
              <Bell className="text-ink" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[15px] text-ink">Push Notifications</div>
              <div className="text-[13px] text-ink-soft mt-0.5 leading-snug">Get alerts when tabs are updated</div>
            </div>
          </div>
          <button 
            onClick={toggleNotifications}
            disabled={isSubscribing}
            className={`shrink-0 w-12 h-6 rounded-full transition-colors relative cursor-pointer border-none ${isNotificationsEnabled ? 'bg-primary' : 'bg-[#D0D0D0]'}`}
          >
            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isNotificationsEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 sm:p-5 gap-4 hover:bg-bg transition-colors" style={{ background: 'rgba(200,30,30,0.03)' }}>
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center shrink-0 border border-line-dark">
              <LogOut className="text-[#c81e1e]" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[15px] text-[#c81e1e]">Sign Out</div>
              <div className="text-[13px] text-ink-soft mt-0.5 leading-snug">End your current session</div>
            </div>
          </div>
          <button 
            onClick={async () => {
              if (await showConfirm('Sign Out', 'Are you sure you want to sign out?', { danger: true })) {
                logout();
              }
            }}
            className="shrink-0 px-4 py-2 text-[14px] font-medium rounded-xl transition-colors cursor-pointer bg-transparent text-[#c81e1e] hover:bg-[#c81e1e] hover:text-white"
            style={{border: '1px solid #c81e1e'}}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}