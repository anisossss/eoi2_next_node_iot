'use client';

import { useStore } from '@/store/useStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { LayoutGrid, TreeDeciduous, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ViewMode } from '@/types';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const { viewMode, setViewMode, isConnected, lastUpdateTime } = useStore();

  const viewModes: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'grid', label: 'Grid View', icon: <LayoutGrid className="w-4 h-4" /> },
    { value: 'tree', label: 'Tree View', icon: <TreeDeciduous className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  CSIR IoT Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weather & Sensor Monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Center - View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {viewModes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  viewMode === mode.value
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Right - Status and Actions */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <div
                className={cn(
                  'flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium',
                  isConnected
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </div>

            {/* Last Update Time */}
            {lastUpdateTime && (
              <span className="hidden lg:block text-xs text-slate-500 dark:text-slate-400">
                Updated {formatRelativeTime(lastUpdateTime)}
              </span>
            )}

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile View Mode Toggle */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {viewModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setViewMode(mode.value)}
              className={cn(
                'flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                viewMode === mode.value
                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              )}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
