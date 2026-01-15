import { useState, useEffect } from 'react';
import { dashboardPreferencesApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { WidgetConfig, DashboardLayout, UserDashboardPreference } from '@/types';

export function useDashboardPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserDashboardPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardPreferencesApi.get();
      setPreferences(data);
    } catch (err) {
      console.error('Failed to fetch dashboard preferences:', err);
      setError('Dashboard tercihleri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Update preferences
  const updatePreferences = async (updates: {
    widgets?: WidgetConfig[];
    layout?: DashboardLayout;
    theme?: 'default' | 'dark' | 'light' | 'auto';
  }) => {
    if (!user || !preferences) return;

    try {
      const updated = await dashboardPreferencesApi.update(updates);
      setPreferences(updated);
      return updated;
    } catch (err) {
      console.error('Failed to update dashboard preferences:', err);
      setError('Dashboard tercihleri güncellenirken bir hata oluştu');
      throw err;
    }
  };

  // Update widgets
  const updateWidgets = async (widgets: WidgetConfig[]) => {
    return updatePreferences({ widgets });
  };

  // Update layout
  const updateLayout = async (layout: DashboardLayout) => {
    return updatePreferences({ layout });
  };

  // Update theme
  const updateTheme = async (theme: 'default' | 'dark' | 'light' | 'auto') => {
    return updatePreferences({ theme });
  };

  // Initialize on mount
  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    widgets: preferences?.widgets || [],
    layout: preferences?.layout || { columns: 3, gap: 6, padding: 6 },
    theme: preferences?.theme || 'default',
    isLoading,
    error,
    updatePreferences,
    updateWidgets,
    updateLayout,
    updateTheme,
    refetch: fetchPreferences,
  };
}