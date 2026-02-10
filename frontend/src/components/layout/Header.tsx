'use client';

import { useStore } from '@/store/useStore';
import { cn, formatRelativeTime } from '@/lib/utils';
import { LayoutGrid, TreeDeciduous, RefreshCw, Wifi, WifiOff, Radio, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ViewMode } from '@/types';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const { viewMode, setViewMode, connectionStatus, lastUpdateTime } = useStore();
  const isConnected = connectionStatus === 'connected';

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
            {/* Connection Status — futuristic live/connecting/reconnecting */}
            <div className="hidden sm:flex items-center space-x-2">
              {connectionStatus === 'connected' && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-700/50">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 glow-dot" />
                  </span>
                  <Radio className="w-3 h-3" />
                  <span>Live</span>
                </div>
              )}
              {(connectionStatus === 'connecting' || connectionStatus === 'reconnecting') && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>
                    {connectionStatus === 'connecting' ? 'Connecting' : 'Reconnecting'}
                    <span className="inline-flex ml-0.5 gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="animate-connecting-dots opacity-40"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        >
                          .
                        </span>
                      ))}
                    </span>
                  </span>
                </div>
              )}
              {connectionStatus === 'disconnected' && (
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                  <WifiOff className="w-3 h-3" />
                  <span>Polling</span>
                </div>
              )}
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
