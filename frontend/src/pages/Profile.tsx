import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import axios from 'axios';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [preferences, setPreferences] = useState({
    theme: theme as 'light' | 'dark',
    dashboardLayout: 'grid' as 'grid' | 'list',
    refreshInterval: 30,
    notifications: {
      enabled: true,
      types: {
        serviceStatus: true,
        downloadComplete: true,
        healthWarnings: true,
        systemAlerts: true,
      },
    },
    display: {
      itemsPerPage: 20,
      compactView: false,
      showHealthIndicators: true,
      showQuickActions: true,
    },
  });
  const [prefStatus, setPrefStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccessMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to change password';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrefChange = (changes: Partial<typeof preferences>) => {
    setPreferences((prev) => ({ ...prev, ...changes }));
    setPrefStatus('idle');
  };

  const handleSavePreferences = async () => {
    try {
      setPrefStatus('saving');
      // Apply theme immediately
      if (preferences.theme !== theme) toggleTheme();
      // TODO: Persist preferences to backend or localStorage if needed
      setPrefStatus('saved');
      setTimeout(() => setPrefStatus('idle'), 1500);
    } catch (e) {
      setPrefStatus('error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Preferences</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePrefChange({ theme: e.target.value as 'light' | 'dark' })}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dashboard Layout</label>
                <select
                  value={preferences.dashboardLayout}
                  onChange={(e) => handlePrefChange({ dashboardLayout: e.target.value as 'grid' | 'list' })}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Refresh Interval (seconds)</label>
                <input
                  type="number"
                  value={preferences.refreshInterval}
                  onChange={(e) => handlePrefChange({ refreshInterval: parseInt(e.target.value) })}
                  min={5}
                  max={300}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items Per Page</label>
                <input
                  type="number"
                  value={preferences.display.itemsPerPage}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      display: { ...prev.display, itemsPerPage: parseInt(e.target.value) },
                    }))
                  }
                  min={5}
                  max={100}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Options</label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compactView"
                    checked={preferences.display.compactView}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        display: { ...prev.display, compactView: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="compactView" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Compact View</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showHealthIndicators"
                    checked={preferences.display.showHealthIndicators}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        display: { ...prev.display, showHealthIndicators: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="showHealthIndicators" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Health Indicators</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showQuickActions"
                    checked={preferences.display.showQuickActions}
                    onChange={(e) =>
                      setPreferences((prev) => ({
                        ...prev,
                        display: { ...prev.display, showQuickActions: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="showQuickActions" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Quick Actions</label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notifications</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  checked={preferences.notifications.enabled}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, enabled: e.target.checked },
                    }))
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="notificationsEnabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Notifications</label>
              </div>
              {preferences.notifications.enabled && (
                <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.types.serviceStatus}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            types: { ...prev.notifications.types, serviceStatus: e.target.checked },
                          },
                        }))
                      }
                      className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    Service Status Changes
                  </label>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.types.downloadComplete}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            types: { ...prev.notifications.types, downloadComplete: e.target.checked },
                          },
                        }))
                      }
                      className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    Download Complete
                  </label>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.types.healthWarnings}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            types: { ...prev.notifications.types, healthWarnings: e.target.checked },
                          },
                        }))
                      }
                      className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    Health Warnings
                  </label>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.types.systemAlerts}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            types: { ...prev.notifications.types, systemAlerts: e.target.checked },
                          },
                        }))
                      }
                      className="mr-2 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    System Alerts
                  </label>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSavePreferences}
                disabled={prefStatus === 'saving'}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  prefStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : prefStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {prefStatus === 'saving' ? 'Saving...' : prefStatus === 'saved' ? 'Saved!' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Username</div>
              <div className="text-gray-900 dark:text-gray-100">{user?.username || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
              <div className="text-gray-900 dark:text-gray-100">{user?.email || '-'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Security</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {successMsg && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input
                type="password"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {submitting ? 'Saving...' : 'Change Password'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
