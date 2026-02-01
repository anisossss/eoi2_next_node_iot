'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn, formatNumber, formatTime, formatRelativeTime } from '@/lib/utils';
import { 
  ChevronRight, 
  ChevronDown, 
  Server, 
  Radio, 
  Activity, 
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Clock,
  MapPin,
  Leaf
} from 'lucide-react';
import type { TreeNode, CurrentWeather } from '@/types';

interface TreeViewProps {
  isUpdating?: boolean;
}

export function TreeView({ isUpdating }: TreeViewProps) {
  const { treeData, currentWeather } = useStore();

  // Build weather tree from current weather data
  const weatherTree: TreeNode | null = currentWeather ? {
    name: 'Weather Data',
    type: 'root',
    children: [
      {
        name: 'Current Weather',
        type: 'sensor',
        sensorId: 'weather-api',
        sensorType: 'combined',
        isActive: true,
        location: {
          latitude: currentWeather.latitude,
          longitude: currentWeather.longitude,
          name: 'Pretoria, South Africa'
        },
        children: [
          {
            name: 'Latest Reading',
            type: 'reading',
            timestamp: currentWeather.timestamp,
            children: [
              {
                name: 'temperature',
                type: 'data',
                value: formatNumber(currentWeather.temperature, 1),
                unit: '°C'
              },
              {
                name: 'windspeed',
                type: 'data',
                value: formatNumber(currentWeather.windspeed, 1),
                unit: 'km/h'
              },
              {
                name: 'winddirection',
                type: 'data',
                value: currentWeather.winddirection.toString(),
                unit: '°'
              },
              {
                name: 'weathercode',
                type: 'data',
                value: currentWeather.weathercode.toString(),
                unit: ''
              },
              {
                name: 'elevation',
                type: 'data',
                value: currentWeather.elevation.toString(),
                unit: 'm'
              }
            ]
          }
        ]
      }
    ]
  } : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Weather Tree */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <Leaf className="w-5 h-5 text-green-500" />
          <span>Interactive Tree View</span>
        </h2>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Server className="w-4 h-4 text-primary-500" />
              <span>Weather & IoT Data Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              {weatherTree && (
                <TreeNodeComponent 
                  node={weatherTree} 
                  level={0} 
                  isUpdating={isUpdating}
                />
              )}
              {treeData && (
                <TreeNodeComponent 
                  node={treeData} 
                  level={0} 
                  isUpdating={isUpdating}
                />
              )}
              {!weatherTree && !treeData && (
                <div className="flex items-center justify-center py-8 text-slate-500 dark:text-slate-400">
                  <Activity className="w-5 h-5 mr-2 animate-pulse" />
                  <span>Loading tree data...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tree Legend */}
      <section>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tree Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <LegendItem 
                icon={<Server className="w-4 h-4 text-primary-500" />} 
                label="Root/Network" 
              />
              <LegendItem 
                icon={<Radio className="w-4 h-4 text-green-500" />} 
                label="Sensor" 
              />
              <LegendItem 
                icon={<Activity className="w-4 h-4 text-blue-500" />} 
                label="Reading" 
              />
              <LegendItem 
                icon={<Thermometer className="w-4 h-4 text-amber-500" />} 
                label="Data Point" 
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Tree Node Component
interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  isUpdating?: boolean;
}

function TreeNodeComponent({ node, level, isUpdating }: TreeNodeComponentProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const getIcon = () => {
    switch (node.type) {
      case 'root':
        return <Server className="w-4 h-4 text-primary-500" />;
      case 'sensor':
        return <Radio className={cn(
          'w-4 h-4',
          node.isActive ? 'text-green-500' : 'text-slate-400'
        )} />;
      case 'reading':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'data':
        return getDataIcon(node.name);
      default:
        return <Leaf className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBgColor = () => {
    switch (node.type) {
      case 'root':
        return 'bg-primary-50 dark:bg-primary-900/20';
      case 'sensor':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'reading':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'data':
        return 'bg-amber-50 dark:bg-amber-900/20';
      default:
        return 'bg-slate-50 dark:bg-slate-800';
    }
  };

  return (
    <div className="tree-node">
      {/* Node Content */}
      <div
        onClick={hasChildren ? toggleExpand : undefined}
        className={cn(
          'flex items-center space-x-2 p-2 rounded-lg transition-all duration-200',
          hasChildren && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800',
          getBgColor()
        )}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Node Icon */}
        {getIcon()}

        {/* Node Name */}
        <span className={cn(
          'font-medium',
          node.type === 'root' ? 'text-primary-700 dark:text-primary-400' :
          node.type === 'sensor' ? 'text-green-700 dark:text-green-400' :
          node.type === 'reading' ? 'text-blue-700 dark:text-blue-400' :
          'text-slate-700 dark:text-slate-300'
        )}>
          {node.name}
        </span>

        {/* Value (for data nodes) */}
        {node.type === 'data' && node.value !== undefined && (
          <span className="ml-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-sm font-mono">
            {node.value} {node.unit}
          </span>
        )}

        {/* Sensor Type Badge */}
        {node.type === 'sensor' && node.sensorType && (
          <span className="ml-2 px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
            {node.sensorType}
          </span>
        )}

        {/* Active Status */}
        {node.type === 'sensor' && node.isActive !== undefined && (
          <span className={cn(
            'w-2 h-2 rounded-full ml-auto',
            node.isActive ? 'bg-green-500' : 'bg-slate-400'
          )} />
        )}

        {/* Timestamp */}
        {node.type === 'reading' && node.timestamp && (
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatRelativeTime(node.timestamp)}
          </span>
        )}

        {/* Location */}
        {node.type === 'sensor' && node.location && (
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 flex items-center">
            <MapPin className="w-3 h-3 mr-1" />
            {node.location.name}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className={cn(
          'tree-children transition-all duration-300',
          isExpanded ? 'tree-node-expanded' : 'tree-node-collapsed'
        )}>
          {node.children!.map((child, index) => (
            <TreeNodeComponent
              key={`${child.name}-${index}`}
              node={child}
              level={level + 1}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get data-specific icons
function getDataIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'temperature':
      return <Thermometer className="w-4 h-4 text-red-500" />;
    case 'humidity':
      return <Droplets className="w-4 h-4 text-blue-500" />;
    case 'pressure':
      return <Gauge className="w-4 h-4 text-purple-500" />;
    case 'windspeed':
    case 'winddirection':
      return <Wind className="w-4 h-4 text-cyan-500" />;
    default:
      return <Activity className="w-4 h-4 text-amber-500" />;
  }
}

// Legend Item Component
function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center space-x-2">
      {icon}
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  );
}
