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
  ExternalLink,
  ShoppingBag,
  Download,
  Star,
  Package,
  Search,
  Filter,
  Grid3X3,
  List
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
  definition?: ServiceDefinition;
}

interface ServiceDefinition {
  id: string;
  serviceId: string;
  name: string;
  displayName: string;
  version: string;
  author: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: string;
  tags: string[];
  featured: boolean;
  official: boolean;
  installCount: number;
  manifest: any;
}

interface MarketplaceService {
  id: string;
  serviceId: string;
  name: string;
  displayName: string;
  version: string;
  author: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  featured: boolean;
  official: boolean;
  installCount: number;
}

const Services: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMarketplaceService, setSelectedMarketplaceService] = useState<MarketplaceService | null>(null);

  // Fetch installed services
  const { data: services = [], isLoading: servicesLoading, error: servicesError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await axios.get('/api/services');
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  // Fetch marketplace services
  const { data: marketplaceData, isLoading: marketplaceLoading } = useQuery({
    queryKey: ['marketplace', selectedCategory, searchQuery],
    queryFn: async () => {
      let url = '/api/marketplace/services';
      const params = new URLSearchParams();
      
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      return response.data.data;
    },
    enabled: activeTab === 'marketplace',
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const response = await axios.get('/api/marketplace/categories');
      return response.data.data;
    },
    enabled: activeTab === 'marketplace',
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

  // Install from marketplace mutation
  const installMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await axios.post(`/api/marketplace/install/${serviceId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setActiveTab('installed');
    },
  });

  // Sync marketplace mutation
  const syncMarketplaceMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/marketplace/sync');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      media: '🎬',
      automation: '🤖',
      monitoring: '📊',
      networking: '🌐',
      storage: '💾',
      security: '🔒',
      development: '👨‍💻',
      productivity: '📈',
      communication: '💬',
      gaming: '🎮',
      'home-automation': '🏠',
      data: '📊',
      infrastructure: '🏗️',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  const filteredMarketplaceServices = marketplaceData?.filter((service: MarketplaceService) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
        
        <div className="flex items-center gap-4">
          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setActiveTab('installed')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'installed'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Server className="inline-block h-4 w-4 mr-2" />
              Installed ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'marketplace'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="inline-block h-4 w-4 mr-2" />
              Marketplace
            </button>
          </div>

          {activeTab === 'installed' && (
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {activeTab === 'marketplace' && (
            <Button 
              onClick={() => syncMarketplaceMutation.mutate()} 
              size="sm" 
              variant="outline"
              disabled={syncMarketplaceMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${syncMarketplaceMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Marketplace Controls */}
      {activeTab === 'marketplace' && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.value} value={cat.value}>
                {getCategoryIcon(cat.value)} {cat.label} ({cat.count})
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'installed' ? (
        /* Installed Services */
        servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card className="p-12 text-center">
            <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Services Installed</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Browse the marketplace to find and install services for your homelab
            </p>
            <Button onClick={() => setActiveTab('marketplace')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Marketplace
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: Service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{service.definition?.icon || '📦'}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {service.definition?.displayName || service.type}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(service.status)}
                        <span>{service.status}</span>
                      </div>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {service.description}
                    </p>
                  )}

                  {service.url && (
                    <div className="mb-4">
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Service
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkStatusMutation.mutate(service.id)}
                        disabled={checkStatusMutation.isPending}
                      >
                        <RefreshCw className={`h-3 w-3 ${checkStatusMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingService(service)}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${service.name}?`)) {
                          deleteMutation.mutate(service.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        /* Marketplace */
        marketplaceLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : filteredMarketplaceServices.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Services Found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try adjusting your search terms' : 'No services available in this category'}
            </p>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredMarketplaceServices.map((service: MarketplaceService) => (
              <Card 
                key={service.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedMarketplaceService(service)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{service.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {service.displayName}
                          {service.official && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              Official
                            </span>
                          )}
                          {service.featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          v{service.version} by {service.author}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {service.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Install ${service.displayName}?`)) {
                          installMutation.mutate(service.serviceId);
                        }
                      }}
                      disabled={installMutation.isPending}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                  </div>

                  {service.installCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {service.installCount} installations
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Service Details Modal */}
      {selectedMarketplaceService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{selectedMarketplaceService.icon}</div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedMarketplaceService.displayName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      v{selectedMarketplaceService.version} by {selectedMarketplaceService.author}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMarketplaceService(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {selectedMarketplaceService.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedMarketplaceService.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={() => {
                    if (confirm(`Install ${selectedMarketplaceService.displayName}?`)) {
                      installMutation.mutate(selectedMarketplaceService.serviceId);
                      setSelectedMarketplaceService(null);
                    }
                  }}
                  disabled={installMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Service
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedMarketplaceService(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;