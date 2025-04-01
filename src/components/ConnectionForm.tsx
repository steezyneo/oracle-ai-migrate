
import React, { useState, useEffect } from 'react';
import { DatabaseConnection, DatabaseType } from '@/types';
import { saveConnection, loadConnection, testConnection } from '@/utils/databaseUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Server, Key, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectionFormProps {
  onComplete: (sybaseConn: DatabaseConnection, oracleConn: DatabaseConnection) => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onComplete }) => {
  const [activeTab, setActiveTab] = useState<DatabaseType>('sybase');
  const { toast } = useToast();
  
  const defaultConnection: DatabaseConnection = {
    type: 'sybase',
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
    connectionString: '',
  };
  
  const [sybaseConnection, setSybaseConnection] = useState<DatabaseConnection>({
    ...defaultConnection,
    type: 'sybase',
  });
  
  const [oracleConnection, setOracleConnection] = useState<DatabaseConnection>({
    ...defaultConnection,
    type: 'oracle',
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    // Load saved connections if available
    const savedSybase = loadConnection('sybase');
    const savedOracle = loadConnection('oracle');
    
    if (savedSybase) {
      setSybaseConnection(savedSybase);
    }
    
    if (savedOracle) {
      setOracleConnection(savedOracle);
    }
  }, []);
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: DatabaseType
  ) => {
    const { name, value } = e.target;
    
    if (type === 'sybase') {
      setSybaseConnection(prev => ({ ...prev, [name]: value }));
    } else {
      setOracleConnection(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleTestConnection = async (type: DatabaseType) => {
    setIsLoading(true);
    const connection = type === 'sybase' ? sybaseConnection : oracleConnection;
    
    try {
      const result = await testConnection(connection);
      
      toast({
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'An unexpected error occurred while testing the connection.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveConnections = async () => {
    setIsLoading(true);
    
    try {
      await saveConnection(sybaseConnection);
      await saveConnection(oracleConnection);
      
      toast({
        title: 'Connections Saved',
        description: 'Your database connections have been saved successfully.',
      });
      
      onComplete(sybaseConnection, oracleConnection);
    } catch (error) {
      toast({
        title: 'Save Error',
        description: 'Failed to save connection details.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Database Connections</CardTitle>
          <CardDescription>
            Configure connections to your Sybase source and Oracle target databases.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="sybase" onValueChange={(value) => setActiveTab(value as DatabaseType)}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="sybase">Sybase (Source)</TabsTrigger>
              <TabsTrigger value="oracle">Oracle (Target)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sybase">
              <div className="grid gap-6">
                <div className="flex items-center gap-4">
                  <Server className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-medium">Server Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the Sybase server details
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sybase-host">Host</Label>
                    <Input
                      id="sybase-host"
                      name="host"
                      placeholder="localhost or IP address"
                      value={sybaseConnection.host}
                      onChange={(e) => handleInputChange(e, 'sybase')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sybase-port">Port</Label>
                    <Input
                      id="sybase-port"
                      name="port"
                      placeholder="5000"
                      value={sybaseConnection.port}
                      onChange={(e) => handleInputChange(e, 'sybase')}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <User className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Credentials for the Sybase database
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sybase-username">Username</Label>
                    <Input
                      id="sybase-username"
                      name="username"
                      placeholder="dba"
                      value={sybaseConnection.username}
                      onChange={(e) => handleInputChange(e, 'sybase')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sybase-password">Password</Label>
                    <Input
                      id="sybase-password"
                      name="password"
                      type="password"
                      value={sybaseConnection.password}
                      onChange={(e) => handleInputChange(e, 'sybase')}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <Database className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-medium">Database</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the Sybase database name
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sybase-database">Database Name</Label>
                  <Input
                    id="sybase-database"
                    name="database"
                    placeholder="master"
                    value={sybaseConnection.database}
                    onChange={(e) => handleInputChange(e, 'sybase')}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleTestConnection('sybase')}
                  disabled={isLoading}
                >
                  Test Sybase Connection
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="oracle">
              <div className="grid gap-6">
                <div className="flex items-center gap-4">
                  <Server className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-medium">Server Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the Oracle server details
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oracle-host">Host</Label>
                    <Input
                      id="oracle-host"
                      name="host"
                      placeholder="localhost or IP address"
                      value={oracleConnection.host}
                      onChange={(e) => handleInputChange(e, 'oracle')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oracle-port">Port</Label>
                    <Input
                      id="oracle-port"
                      name="port"
                      placeholder="1521"
                      value={oracleConnection.port}
                      onChange={(e) => handleInputChange(e, 'oracle')}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <User className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Credentials for the Oracle database
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oracle-username">Username</Label>
                    <Input
                      id="oracle-username"
                      name="username"
                      placeholder="system"
                      value={oracleConnection.username}
                      onChange={(e) => handleInputChange(e, 'oracle')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oracle-password">Password</Label>
                    <Input
                      id="oracle-password"
                      name="password"
                      type="password"
                      value={oracleConnection.password}
                      onChange={(e) => handleInputChange(e, 'oracle')}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-6">
                  <Database className="h-6 w-6 text-muted-foreground" />
                  <div className="grid gap-1">
                    <h3 className="text-lg font-medium">Database</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the Oracle database details
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="oracle-database">Database/SID</Label>
                  <Input
                    id="oracle-database"
                    name="database"
                    placeholder="ORCL"
                    value={oracleConnection.database}
                    onChange={(e) => handleInputChange(e, 'oracle')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="oracle-connection-string">Connection String (Optional)</Label>
                  <Input
                    id="oracle-connection-string"
                    name="connectionString"
                    placeholder="Example: jdbc:oracle:thin:@localhost:1521:ORCL"
                    value={oracleConnection.connectionString || ''}
                    onChange={(e) => handleInputChange(e, 'oracle')}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleTestConnection('oracle')}
                  disabled={isLoading}
                >
                  Test Oracle Connection
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleSaveConnections}
            disabled={isLoading}
          >
            Save Connections & Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConnectionForm;
