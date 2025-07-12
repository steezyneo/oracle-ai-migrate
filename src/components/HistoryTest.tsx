import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMigrationManager } from './MigrationManager';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HistoryTest: React.FC = () => {
  const { user } = useAuth();
  const { startNewMigration, getUserMigrations, getMigrationStats } = useMigrationManager();
  const [migrations, setMigrations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadMigrations();
    }
  }, [user]);

  const loadMigrations = async () => {
    setLoading(true);
    try {
      const userMigrations = await getUserMigrations();
      setMigrations(userMigrations);
      console.log('User migrations:', userMigrations);
    } catch (error) {
      console.error('Error loading migrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCreateMigration = async () => {
    try {
      const migrationId = await startNewMigration('Test Migration');
      console.log('Created migration:', migrationId);
      await loadMigrations();
    } catch (error) {
      console.error('Error creating migration:', error);
    }
  };

  const testGetStats = async (migrationId: string) => {
    try {
      const migrationStats = await getMigrationStats(migrationId);
      setStats(migrationStats);
      console.log('Migration stats:', migrationStats);
    } catch (error) {
      console.error('Error getting stats:', error);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('migrations')
        .select('count')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Database connection error:', error);
      } else {
        console.log('Database connection successful');
      }
    } catch (error) {
      console.error('Database test failed:', error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>History System Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please sign in to test the history system.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>History System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testCreateMigration} disabled={loading}>
              Create Test Migration
            </Button>
            <Button onClick={testDatabaseConnection} variant="outline">
              Test Database Connection
            </Button>
            <Button onClick={loadMigrations} variant="outline">
              Refresh Migrations
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">User Migrations ({migrations.length})</h3>
            {migrations.map((migration) => (
              <div key={migration.id} className="border p-3 rounded mb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>{migration.project_name}</strong>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(migration.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Files: {migration.migration_files?.length || 0}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => testGetStats(migration.id)}
                    variant="outline"
                  >
                    Get Stats
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {stats && (
            <div>
              <h3 className="font-semibold mb-2">Migration Statistics</h3>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <div className="bg-blue-100 p-2 rounded text-center">
                  <div className="font-bold">{stats.total_files}</div>
                  <div>Total</div>
                </div>
                <div className="bg-green-100 p-2 rounded text-center">
                  <div className="font-bold">{stats.success_files}</div>
                  <div>Success</div>
                </div>
                <div className="bg-red-100 p-2 rounded text-center">
                  <div className="font-bold">{stats.failed_files}</div>
                  <div>Failed</div>
                </div>
                <div className="bg-orange-100 p-2 rounded text-center">
                  <div className="font-bold">{stats.pending_files}</div>
                  <div>Pending</div>
                </div>
                <div className="bg-purple-100 p-2 rounded text-center">
                  <div className="font-bold">{stats.deployed_files}</div>
                  <div>Deployed</div>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Check the browser console for detailed logs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryTest; 