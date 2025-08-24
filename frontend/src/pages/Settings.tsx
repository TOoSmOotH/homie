import React from 'react';
import { Card } from '@/components/ui/Card';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const settingSections = [
    {
      title: 'Profile',
      description: 'Manage your account settings',
      icon: User,
      items: ['Personal Information', 'Password', 'Notifications']
    },
    {
      title: 'System',
      description: 'System-wide configuration',
      icon: SettingsIcon,
      items: ['General Settings', 'Backup & Restore', 'Updates']
    },
    {
      title: 'Security',
      description: 'Security and access settings',
      icon: Shield,
      items: ['Authentication', 'API Keys', 'Access Control']
    },
    {
      title: 'Services',
      description: 'Service-specific configurations',
      icon: Database,
      items: ['Service Discovery', 'Auto-start', 'Monitoring']
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure your Homie application</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <button className="text-left text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;