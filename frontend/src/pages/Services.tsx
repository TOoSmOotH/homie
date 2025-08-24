import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import axios from 'axios';
import { 
  Server, 
  Play, 
  Square, 
  Settings, 
  Plus, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit2,
  ExternalLink
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  type: string;
  url?: string;
  status: 'online' | 'offline' | 'unknown';
  description?: string;
  config?: any;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

const Services: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Fetch services from API
  const { data: services = [], isLoading, error, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await axios.get('/api/services');
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Delete service mutation
  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await axios.delete(`/api/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  // Check service status mutation
  const checkStatusMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await axios.post(`/api/services/${serviceId}/check`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'offline':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">
              Failed to load services. Please try refreshing the page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Services</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and monitor your homelab services</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Service</span>
          </Button>
        </div>
      </div>

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <Server className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Services Configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by adding your first service to monitor
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Service
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: Service) => (
            <Card key={service.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{service.type}</p>
                  </div>
                </div>
                {getStatusIcon(service.status)}
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
                {service.lastChecked && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Checked {new Date(service.lastChecked).toLocaleTimeString()}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  {service.url && (
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                      title="Open service"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => checkStatusMutation.mutate(service.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Check status"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingService(service)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Edit service"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${service.name}?`)) {
                      deleteMutation.mutate(service.id);
                    }
                  }}
                  className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {(showAddModal || editingService) && (
        <ServiceModal
          service={editingService}
          onClose={() => {
            setShowAddModal(false);
            setEditingService(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            setShowAddModal(false);
            setEditingService(null);
          }}
        />
      )}
    </div>
  );
};

// Service Modal Component
const ServiceModal: React.FC<{
  service?: Service | null;
  onClose: () => void;
  onSave: () => void;
}> = ({ service, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    type: service?.type || '',
    url: service?.url || '',
    description: service?.description || '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (service) {
        await axios.put(`/api/services/${service.id}`, data);
      } else {
        await axios.post('/api/services', data);
      }
    },
    onSuccess: () => {
      onSave();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {service ? 'Edit Service' : 'Add Service'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select a type</option>
              <option value="docker">Docker Container</option>
              <option value="vm">Virtual Machine</option>
              <option value="web">Web Service</option>
              <option value="database">Database</option>
              <option value="media">Media Server</option>
              <option value="monitoring">Monitoring</option>
              <option value="networking">Networking</option>
              <option value="storage">Storage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service URL (optional)
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="http://192.168.1.100:8080"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : service ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Services;