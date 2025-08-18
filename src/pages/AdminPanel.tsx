import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Settings, 
  Activity, 
  FileText, 
  Shield, 
  BarChart3, 
  Trash2, 
  Edit,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Calendar,
  TrendingUp,
  FileCode,
  User,
  History
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile, SystemSetting, AdminLog, MigrationStats } from '@/types/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RewritePromptsNotification from '@/components/RewritePromptsNotification';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { 
    isAdmin, 
    loading, 
    getUsers, 
    updateUserRole, 
    deleteUser,
    getSystemSettings, 
    updateSystemSetting,
    getAdminLogs,
    getMigrationStats,
    getUserDetails
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [showSettingDialog, setShowSettingDialog] = useState(false);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [showUserHistoryDialog, setShowUserHistoryDialog] = useState(false);
  const [userHistory, setUserHistory] = useState<any>(null);
  const [loadingUserHistory, setLoadingUserHistory] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/migration');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [usersData, settingsData, logsData, statsData] = await Promise.allSettled([
        getUsers(),
        getSystemSettings(),
        getAdminLogs(),
        getMigrationStats()
      ]);

      setUsers(usersData.status === 'fulfilled' ? usersData.value : []);
      setSystemSettings(settingsData.status === 'fulfilled' ? settingsData.value : []);
      setAdminLogs(logsData.status === 'fulfilled' ? logsData.value : []);
      setMigrationStats(statsData.status === 'fulfilled' ? statsData.value : null);

      // Log any errors for debugging
      if (usersData.status === 'rejected') console.error('Users error:', usersData.reason);
      if (settingsData.status === 'rejected') console.error('Settings error:', settingsData.reason);
      if (logsData.status === 'rejected') console.error('Logs error:', logsData.reason);
      if (statsData.status === 'rejected') console.error('Stats error:', statsData.reason);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleUserRoleUpdate = async (userId: string, role: 'user' | 'admin' | 'moderator') => {
    const success = await updateUserRole(userId, role);
    if (success) {
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
    }
  };

  const handleUserDelete = async () => {
    if (!selectedUser) return;
    
    const success = await deleteUser(selectedUser.id);
    if (success) {
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSettingUpdate = async (settingKey: string, settingValue: any) => {
    const success = await updateSystemSetting(settingKey, settingValue);
    if (success) {
      setSystemSettings(settings => 
        settings.map(setting => 
          setting.setting_key === settingKey 
            ? { ...setting, setting_value: settingValue }
            : setting
        )
      );
      setShowSettingDialog(false);
      setEditingSetting(null);
    }
  };

  const handleViewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserDetailsDialog(true);
    setLoadingUserDetails(true);
    
    try {
      const details = await getUserDetails(user.id);
      setUserDetails(details);
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleViewUserHistory = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserHistoryDialog(true);
    setLoadingUserHistory(true);
    
    try {
      const details = await getUserDetails(user.id);
      setUserHistory(details);
    } catch (error) {
      console.error('Error loading user history:', error);
    } finally {
      setLoadingUserHistory(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/migration')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">System administration and monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {profile?.role || 'Admin'}
              </Badge>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Rewrite Prompts Notification for Admins */}
             <RewritePromptsNotification isAdmin={isAdmin} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{migrationStats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {migrationStats?.active_users_today || 0} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Migrations</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{migrationStats?.total_migrations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {migrationStats?.total_files || 0} files processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {migrationStats?.total_files 
                      ? Math.round((migrationStats.successful_conversions / migrationStats.total_files) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {migrationStats?.successful_conversions || 0} successful
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{log.target_type}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(role) => handleUserRoleUpdate(user.id, role as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                {/* Only show admin option if current user is admin and target user is not admin */}
                                {profile?.role === 'admin' && user.role !== 'admin' && (
                                  <SelectItem value="admin">Admin</SelectItem>
                                )}
                                {/* Show admin option if current user is admin and target user is admin (for demotion) */}
                                {profile?.role === 'admin' && user.role === 'admin' && (
                                  <SelectItem value="admin">Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Only show delete button for admins */}
                            {profile?.role === 'admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUserDetails(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUserHistory(user)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {systemSettings.map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{setting.setting_key}</h3>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {JSON.stringify(setting.setting_value)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingSetting(setting);
                          setShowSettingDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  View all administrative actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.admin_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.target_type}</p>
                            {log.target_id && (
                              <p className="text-xs text-muted-foreground">{log.target_id}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.details && (
                            <pre className="text-xs bg-gray-100 p-1 rounded">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete user "{selectedUser?.full_name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUserDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettingDialog} onOpenChange={setShowSettingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting: {editingSetting?.setting_key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Value</Label>
              <Input
                value={JSON.stringify(editingSetting?.setting_value)}
                onChange={(e) => {
                  try {
                    const value = JSON.parse(e.target.value);
                    setEditingSetting(prev => prev ? { ...prev, setting_value: value } : null);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                placeholder="Enter JSON value"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {editingSetting?.description}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingSetting) {
                  handleSettingUpdate(editingSetting.setting_key, editingSetting.setting_value);
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserDetailsDialog} onOpenChange={setShowUserDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details: {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingUserDetails ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading user details...</span>
            </div>
          ) : userDetails ? (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="migrations">Migration History</TabsTrigger>
                <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">User ID</Label>
                      <p className="text-sm text-muted-foreground font-mono">{userDetails.profile.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{userDetails.profile.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm text-muted-foreground">{userDetails.profile.full_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Role</Label>
                      <Badge className={getRoleBadgeColor(userDetails.profile.role)}>
                        {userDetails.profile.role}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Joined Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(userDetails.profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Updated</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(userDetails.profile.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="migrations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Migration Projects ({userDetails.migrations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetails.migrations.length === 0 ? (
                      <p className="text-muted-foreground">No migration projects found.</p>
                    ) : (
                      <div className="space-y-4">
                        {userDetails.migrations.map((migration: any) => (
                          <div key={migration.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{migration.project_name}</h4>
                              <Badge variant="outline">
                                {new Date(migration.created_at).toLocaleDateString()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Total Files:</span> {migration.migration_files.length}
                              </div>
                              <div>
                                <span className="font-medium">Successful:</span> 
                                <span className="text-green-600 ml-1">
                                  {migration.migration_files.filter((f: any) => f.conversion_status === 'success').length}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Failed:</span> 
                                <span className="text-red-600 ml-1">
                                  {migration.migration_files.filter((f: any) => f.conversion_status === 'failed').length}
                                </span>
                              </div>
                            </div>
                            {migration.migration_files.length > 0 && (
                              <div className="mt-3">
                                <details className="text-sm">
                                  <summary className="cursor-pointer font-medium">View Files</summary>
                                  <div className="mt-2 space-y-1">
                                    {migration.migration_files.map((file: any) => (
                                      <div key={file.id} className="flex items-center justify-between py-1">
                                        <span className="font-mono text-xs">{file.file_name}</span>
                                        <Badge 
                                          variant={file.conversion_status === 'success' ? 'default' : 
                                                  file.conversion_status === 'failed' ? 'destructive' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {file.conversion_status}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Conversion Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {userDetails.performanceMetrics.total_migrations}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Projects</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {userDetails.performanceMetrics.total_files}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Files</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {userDetails.performanceMetrics.successful_conversions}
                          </div>
                          <div className="text-sm text-muted-foreground">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {userDetails.performanceMetrics.failed_conversions}
                          </div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span>{userDetails.performanceMetrics.success_rate}%</span>
                        </div>
                        <Progress value={userDetails.performanceMetrics.success_rate} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Average Processing Time</span>
                          <span className="text-sm font-medium">
                            {userDetails.performanceMetrics.average_processing_time}s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pending Conversions</span>
                          <span className="text-sm font-medium">
                            {userDetails.performanceMetrics.pending_conversions}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetails.performanceMetrics.recent_activity.length === 0 ? (
                      <p className="text-muted-foreground">No recent activity.</p>
                    ) : (
                      <div className="space-y-2">
                        {userDetails.performanceMetrics.recent_activity.map((activity: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(activity.date).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge 
                              variant={activity.status === 'success' ? 'default' : 
                                      activity.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {activity.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-muted-foreground">Failed to load user details.</p>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUserHistoryDialog} onOpenChange={setShowUserHistoryDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              User History: {selectedUser?.full_name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingUserHistory ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading user history...</span>
            </div>
          ) : userHistory ? (
            <div className="space-y-6">
              
              {/* User Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userHistory.performanceMetrics.total_migrations}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userHistory.performanceMetrics.total_files}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Files</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {userHistory.performanceMetrics.successful_conversions}
                      </div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {userHistory.performanceMetrics.failed_conversions}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Success Rate</span>
                      <span>{userHistory.performanceMetrics.success_rate}%</span>
                    </div>
                    <Progress value={userHistory.performanceMetrics.success_rate} />
                  </div>
                </CardContent>
              </Card>

              {/* Migration Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Migration Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userHistory.migrations.length === 0 ? (
                    <p className="text-muted-foreground">No migration projects found.</p>
                  ) : (
                    <div className="space-y-4">
                      {userHistory.migrations.map((migration: any, index: number) => (
                        <div key={migration.id} className="border-l-4 border-blue-500 pl-4 relative">
                          <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full"></div>
                          <div className="mb-2">
                            <h4 className="font-medium text-lg">{migration.project_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(migration.created_at).toLocaleDateString()} at {new Date(migration.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="font-medium">Files:</span> {migration.migration_files.length}
                            </div>
                            <div>
                              <span className="font-medium">Success:</span> 
                              <span className="text-green-600 ml-1">
                                {migration.migration_files.filter((f: any) => f.conversion_status === 'success').length}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Failed:</span> 
                              <span className="text-red-600 ml-1">
                                {migration.migration_files.filter((f: any) => f.conversion_status === 'failed').length}
                              </span>
                            </div>
                          </div>
                          {migration.migration_files.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <details className="text-sm">
                                <summary className="cursor-pointer font-medium mb-2">View Files ({migration.migration_files.length})</summary>
                                <div className="space-y-1">
                                  {migration.migration_files.map((file: any) => (
                                    <div key={file.id} className="flex items-center justify-between py-1 px-2 bg-white rounded">
                                      <div className="flex items-center gap-2">
                                        <FileCode className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-mono text-xs">{file.file_name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant={file.conversion_status === 'success' ? 'default' : 
                                                  file.conversion_status === 'failed' ? 'destructive' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {file.conversion_status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(file.created_at).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Processing Time</span>
                        <span className="text-sm font-medium">
                          {userHistory.performanceMetrics.average_processing_time}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Pending Conversions</span>
                        <span className="text-sm font-medium">
                          {userHistory.performanceMetrics.pending_conversions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium">
                          {userHistory.performanceMetrics.success_rate}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recent Activity</h4>
                      {userHistory.performanceMetrics.recent_activity.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No recent activity.</p>
                      ) : (
                        <div className="space-y-2">
                          {userHistory.performanceMetrics.recent_activity.slice(0, 5).map((activity: any, index: number) => (
                            <div key={index} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs">
                                  {new Date(activity.date).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge 
                                variant={activity.status === 'success' ? 'default' : 
                                        activity.status === 'failed' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {activity.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground">Failed to load user history.</p>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;