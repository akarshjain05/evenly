import { useState, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { X, Moon, Bell, LogOut } from 'lucide-react';

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

export default function SettingsModal() {
  const { isSettingsOpen, closeSettings, showAlert, showConfirm } = useUIStore();
  const { logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    if ('Notification' in window) {
      setIsNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

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
      showAlert('Info', 'Notifications are already enabled. You can disable them in your browser settings.');
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const { data } = await apiClient.get<{ public_key: string }>('notifications/vapid-public');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.public_key)
        });
        
        await apiClient.post('notifications/subscribe', subscription.toJSON());
        setIsNotificationsEnabled(true);
        showAlert('Success', 'Notifications enabled successfully!');
      } else {
        showAlert('Error', 'Notification permission was denied.');
      }
    } catch (err: any) {
      showAlert('Error', 'Failed to enable notifications: ' + err.message);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-paper w-full sm:w-[400px] rounded-t-[20px] sm:rounded-[20px] shadow-xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-line-dark">
          <h2 className="text-xl font-display font-semibold text-ink m-0">Personal Settings</h2>
          <button onClick={closeSettings} className="p-2 hover:bg-bg rounded-full text-ink-soft transition-colors cursor-pointer border-none bg-transparent">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          
          <div className="flex items-center justify-between p-4 border border-line-dark rounded-[12px]">
            <div className="flex items-center gap-3">
              <Moon className="text-ink" size={20} />
              <div>
                <div className="font-medium text-[15px] text-ink">Dark Mode</div>
                <div className="text-[13px] text-ink-soft">Toggle dark theme appearance</div>
              </div>
            </div>
            <button 
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer border-none ${isDarkMode ? 'bg-primary' : 'bg-[#D0D0D0]'}`}
            >
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-line-dark rounded-[12px]">
            <div className="flex items-center gap-3">
              <Bell className="text-ink" size={20} />
              <div>
                <div className="font-medium text-[15px] text-ink">Push Notifications</div>
                <div className="text-[13px] text-ink-soft">Get alerts when tabs are updated</div>
              </div>
            </div>
            <button 
              onClick={toggleNotifications}
              disabled={isSubscribing || isNotificationsEnabled}
              className={`px-4 py-2 text-sm font-medium rounded-[8px] transition-colors border-none ${
                isNotificationsEnabled 
                  ? 'bg-bg text-primary' 
                  : 'bg-primary text-white cursor-pointer hover:bg-[#112F22]'
              }`}
            >
              {isSubscribing ? 'Enabling...' : isNotificationsEnabled ? 'Enabled' : 'Enable'}
            </button>
          </div>

        </div>

        <div className="p-5 sm:p-6 border-t border-line-dark">
          <button 
            onClick={async () => {
              if (await showConfirm('Sign Out', 'Are you sure you want to sign out?', { danger: true })) {
                closeSettings();
                logout();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium text-[#C25B46] bg-transparent border border-[#C25B46]/40 rounded-[10px] cursor-pointer hover:bg-[#C25B46]/10 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
