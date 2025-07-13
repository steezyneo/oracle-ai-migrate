import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, File, Trash2, Plus, Folder, Info, Download } from 'lucide-react';
import { CodeFile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateTSQLContent } from '@/utils/conversionUtils';

interface CodeUploaderProps {
  onComplete: (files: CodeFile[]) => void;
}

const CodeUploader: React.FC<CodeUploaderProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'mapping' | 'syntax'>('upload');
  const [manualContent, setManualContent] = useState<string>('');
  const [manualFileName, setManualFileName] = useState<string>('');
  const [templateType, setTemplateType] = useState<'table' | 'procedure' | 'trigger'>('table');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
  const processFiles = useCallback((uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    
    console.log('Processing files:', uploadedFiles.length);
    
    Array.from(uploadedFiles).forEach(file => {
      // Skip if file is too large (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: `${file.name} is too large. Please select files under 10MB.`,
          variant: 'destructive'
        });
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const content = e.target.result as string;
          
          // Validate T-SQL content for SQL files
          if (file.name.toLowerCase().endsWith('.sql')) {
            const validation = validateTSQLContent(content);
            if (!validation.isValid) {
              setValidationError(`${file.name}: ${validation.error}`);
              toast({
                title: 'Invalid T-SQL File',
                description: `${file.name}: ${validation.error}`,
                variant: 'destructive'
              });
              return;
            }
          }
          
          const newFile: CodeFile = {
            id: crypto.randomUUID(),
            name: file.name,
            content: content,
            type: determineFileType(file.name, content),
            status: 'pending'
          };
          
          setFiles(prevFiles => {
            // Check if file already exists
            if (prevFiles.some(f => f.name === file.name)) {
              toast({
                title: 'Duplicate File',
                description: `${file.name} is already uploaded.`,
                variant: 'destructive'
              });
              return prevFiles;
            }
            return [...prevFiles, newFile];
          });
          
          // Clear validation error on successful upload
          setValidationError('');
          
          toast({
            title: 'File Uploaded',
            description: `${file.name} has been uploaded successfully.`
          });
        }
      };
      
      reader.onerror = () => {
        toast({
          title: 'Upload Failed',
          description: `Failed to read ${file.name}.`,
          variant: 'destructive'
        });
      };
      
      reader.readAsText(file);
    });
  }, [toast]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Folder upload triggered:', event.target.files);
    const files = event.target.files;
    
    if (files && files.length > 0) {
      console.log('Processing folder with files:', files.length);
      
      // Filter for supported file types
      const supportedFiles = Array.from(files).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['sql', 'txt', 'prc', 'trg', 'tab', 'proc', 'sp'].includes(ext || '');
      });
      
      if (supportedFiles.length === 0) {
        toast({
          title: 'No Supported Files',
          description: 'No supported files found in the selected folder. Please select a folder containing .sql, .txt, .prc, .trg, or .tab files.',
          variant: 'destructive'
        });
        return;
      }
      
      if (supportedFiles.length !== files.length) {
        toast({
          title: 'Some Files Skipped',
          description: `${files.length - supportedFiles.length} unsupported files were skipped. Only .sql, .txt, .prc, .trg, and .tab files are supported.`,
        });
      }
      
      // Create a new FileList with only supported files
      const dt = new DataTransfer();
      supportedFiles.forEach(file => dt.items.add(file));
      
      processFiles(dt.files);
    } else {
      toast({
        title: 'No Folder Selected',
        description: 'Please select a folder containing files to upload.',
        variant: 'destructive'
      });
    }
    event.target.value = '';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    const droppedFiles = dt.files;
    
    if (droppedFiles && droppedFiles.length > 0) {
      // Filter for supported file types
      const supportedFiles = Array.from(droppedFiles).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['sql', 'txt', 'prc', 'trg', 'tab', 'proc', 'sp'].includes(ext || '');
      });
      
      if (supportedFiles.length === 0) {
        toast({
          title: 'Unsupported Files',
          description: 'Only .sql, .txt, .prc, .trg, and .tab files are supported.',
          variant: 'destructive'
        });
        return;
      }
      
      // Create new FileList with supported files
      const newDt = new DataTransfer();
      supportedFiles.forEach(file => newDt.items.add(file));
      
      processFiles(newDt.files);
    }
  };
  
  const handleDropAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFolderSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };
  
  const determineFileType = (fileName: string, content: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    fileName = fileName.toLowerCase();
    content = content.toLowerCase();
    
    if (fileName.includes('table') || fileName.includes('tbl') || fileName.endsWith('.tab')) {
      return 'table';
    } else if (fileName.includes('proc') || fileName.includes('sp_') || fileName.endsWith('.prc')) {
      return 'procedure';
    } else if (fileName.includes('trig') || fileName.includes('tr_') || fileName.endsWith('.trg')) {
      return 'trigger';
    }
    
    if (fileName.endsWith('.sql')) {
      if (content.includes('create table') || 
          content.includes('alter table') || 
          content.match(/\bcreate\s+.*\s+table\b/i)) {
        return 'table';
      }
      
      if (content.includes('create procedure') || 
          content.includes('create or replace procedure') || 
          content.includes('create proc')) {
        return 'procedure';
      }
      
      if (content.includes('create trigger') || 
          content.includes('create or replace trigger') || 
          content.match(/\btrigger\s+on\b/i)) {
        return 'trigger';
      }
    }
    
    return 'other';
  };
  
  const handleRemoveFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    
    toast({
      title: 'File Removed',
      description: 'The file has been removed from the upload list.'
    });
  };
  
  const handleManualSubmit = () => {
    if (!manualContent.trim()) {
      toast({
        title: 'Empty Content',
        description: 'Please enter code content before adding the file.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!manualFileName.trim()) {
      toast({
        title: 'Missing Filename',
        description: 'Please enter a filename for the code content.',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate T-SQL content for SQL files
    if (manualFileName.toLowerCase().endsWith('.sql')) {
      const validation = validateTSQLContent(manualContent);
      if (!validation.isValid) {
        setValidationError(`${manualFileName}: ${validation.error}`);
        toast({
          title: 'Invalid T-SQL Content',
          description: `${manualFileName}: ${validation.error}`,
          variant: 'destructive'
        });
        return;
      }
    }
    
    const newFile: CodeFile = {
      id: crypto.randomUUID(),
      name: manualFileName,
      content: manualContent,
      type: templateType,
      status: 'pending'
    };
    
    setFiles(prevFiles => [...prevFiles, newFile]);
    
    setManualContent('');
    setManualFileName('');
    
    // Clear validation error on successful manual addition
    setValidationError('');
    
    toast({
      title: 'File Added',
      description: `${manualFileName} has been added to the list.`
    });
  };
  
  const handleChangeFileType = (id: string, newType: 'table' | 'procedure' | 'trigger' | 'other') => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === id ? { ...file, type: newType } : file
      )
    );
    
    toast({
      title: 'File Type Changed',
      description: `The file type has been updated to ${newType}.`
    });
  };
  
  const getFilteredFiles = (type: 'table' | 'procedure' | 'trigger' | 'other') => {
    return files.filter(file => file.type === type);
  };
  
  const handleContinue = () => {
    if (files.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload at least one file to continue.',
        variant: 'destructive'
      });
      return;
    }
    
    onComplete(files);
  };
  
  const getCodeTemplate = (type: 'table' | 'procedure' | 'trigger') => {
    if (type === 'table') {
      return `CREATE TABLE customers (
  customer_id INTEGER IDENTITY(1,1) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL,
  phone CHAR(15) NULL,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT getdate(),
  notes TEXT,
  PRIMARY KEY (customer_id)
)`;
    } else if (type === 'procedure') {
      return `CREATE PROCEDURE get_customer_orders
  @customer_id INT
AS
BEGIN
  SELECT o.order_id, o.order_date, o.total_amount
  FROM orders o
  WHERE o.customer_id = @customer_id
  ORDER BY o.order_date DESC
  
  IF @@ROWCOUNT = 0
    PRINT 'No orders found for this customer'
  
  RETURN @@ROWCOUNT
END`;
    } else {
      return `CREATE TRIGGER trg_order_insert
ON orders
AFTER INSERT
AS
BEGIN
  DECLARE @customer_id INT
  SELECT @customer_id = customer_id FROM inserted
  
  UPDATE customers
  SET last_order_date = GETDATE()
  WHERE customer_id = @customer_id
END`;
    }
  };
  
  const addTemplateCode = (type: 'table' | 'procedure' | 'trigger') => {
    const template = getCodeTemplate(type);
    const fileName = type === 'table' ? 'example_table.sql' : 
                    type === 'procedure' ? 'example_procedure.sql' : 
                    'example_trigger.sql';
    
    setManualFileName(fileName);
    setManualContent(template);
    setTemplateType(type);
  };

  const dataTypeMappings = [
    { tsql: 'INT', plsql: 'NUMBER(10)', usage: 'Primary keys, counters', notes: 'Oracle NUMBER is more flexible' },
    { tsql: 'VARCHAR(n)', plsql: 'VARCHAR2(n)', usage: 'Variable length strings', notes: 'VARCHAR2 recommended in Oracle' },
    { tsql: 'CHAR(n)', plsql: 'CHAR(n)', usage: 'Fixed length strings', notes: 'Same in both databases' },
    { tsql: 'TEXT', plsql: 'CLOB', usage: 'Large text data', notes: 'CLOB for large character data' },
    { tsql: 'DATETIME', plsql: 'DATE', usage: 'Date and time', notes: 'Oracle DATE includes time' },
    { tsql: 'BIT', plsql: 'NUMBER(1)', usage: 'Boolean values', notes: 'Use CHECK constraint (0,1)' },
    { tsql: 'FLOAT', plsql: 'BINARY_FLOAT', usage: 'Floating point', notes: 'Oracle has BINARY_FLOAT/DOUBLE' },
    { tsql: 'DECIMAL(p,s)', plsql: 'NUMBER(p,s)', usage: 'Precise decimal', notes: 'NUMBER is Oracle standard' },
    { tsql: 'IDENTITY', plsql: 'SEQUENCE + TRIGGER', usage: 'Auto-increment', notes: 'Oracle 12c+ has IDENTITY' },
    { tsql: 'UNIQUEIDENTIFIER', plsql: 'RAW(16)', usage: 'GUID/UUID', notes: 'Use SYS_GUID() function' }
  ];

  const syntaxDifferences = [
    { category: 'Variables', tsql: 'DECLARE @var INT', plsql: 'DECLARE var NUMBER;', example: '@customer_id vs customer_id' },
    { category: 'String Concat', tsql: 'str1 + str2', plsql: 'str1 || str2', example: "'Hello' + 'World' vs 'Hello' || 'World'" },
    { category: 'IF Statement', tsql: 'IF condition BEGIN...END', plsql: 'IF condition THEN...END IF;', example: 'IF @count > 0 vs IF count > 0 THEN' },
    { category: 'Error Handling', tsql: 'TRY...CATCH', plsql: 'EXCEPTION WHEN', example: 'BEGIN TRY vs EXCEPTION WHEN OTHERS' },
    { category: 'Loops', tsql: 'WHILE condition BEGIN...END', plsql: 'WHILE condition LOOP...END LOOP;', example: 'WHILE @i < 10 vs WHILE i < 10 LOOP' },
    { category: 'Functions', tsql: 'GETDATE(), LEN()', plsql: 'SYSDATE, LENGTH()', example: 'GETDATE() vs SYSDATE' },
    { category: 'NULL Check', tsql: 'ISNULL(col, default)', plsql: 'NVL(col, default)', example: 'ISNULL(name, "Unknown") vs NVL(name, "Unknown")' },
    { category: 'Top Records', tsql: 'SELECT TOP n', plsql: 'WHERE ROWNUM <= n', example: 'SELECT TOP 10 vs WHERE ROWNUM <= 10' }
  ];
  
  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Sybase Code</CardTitle>
          <CardDescription>
            Upload your Sybase database objects for conversion to Oracle.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="manual">Manual Input</TabsTrigger>
              <TabsTrigger value="mapping">Data Type Mapping</TabsTrigger>
              <TabsTrigger value="syntax">Syntax Differences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                  ${isDragging ? 'border-primary bg-primary/10' : 'bg-muted/30'}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleDropAreaClick}
              >
                <div className="mb-4 flex justify-center">
                  <UploadCloud className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="mb-2 text-lg font-medium">Upload Files</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Drag and drop files or click to browse
                </p>
                <div className="flex gap-3 justify-center">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button variant="secondary">Select Files</Button>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".sql,.txt,.tab,.prc,.trg,.proc,.sp"
                      ref={fileInputRef}
                    />
                  </Label>
                  <Button 
                    variant="outline"
                    type="button"
                    onClick={handleFolderSelect}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Browse Folder
                  </Button>
                  <input
                    id="folder-upload"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    // @ts-ignore
                    webkitdirectory="true"
                    // @ts-ignore
                    directory="true"
                    onChange={handleFolderUpload}
                    ref={folderInputRef}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Supported formats: .sql, .txt, .prc, .trg, .tab, .proc, .sp
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manual-filename" className="mb-2">Filename</Label>
                    <Input
                      id="manual-filename"
                      value={manualFileName}
                      onChange={(e) => setManualFileName(e.target.value)}
                      placeholder="e.g., customers_table.sql"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type" className="mb-2">Template Type</Label>
                    <Select value={templateType} onValueChange={(value: 'table' | 'procedure' | 'trigger') => setTemplateType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="trigger">Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addTemplateCode('table')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Table Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTemplateCode('procedure')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Procedure Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addTemplateCode('trigger')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Trigger Template
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="manual-content" className="mb-2">Code Content</Label>
                  <Textarea
                    id="manual-content"
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Paste your Sybase code here..."
                    className="font-mono min-h-[300px]"
                  />
                </div>
                <Button onClick={handleManualSubmit}>Add File</Button>
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">T-SQL to PL/SQL Data Type Mapping</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-semibold text-sm">
                    <div>T-SQL (Sybase)</div>
                    <div>PL/SQL (Oracle)</div>
                    <div>Usage in Code</div>
                    <div>Notes</div>
                  </div>
                  <ScrollArea className="max-h-96">
                    {dataTypeMappings.map((mapping, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-3 border-t text-sm">
                        <code className="font-mono bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-2 py-1 rounded">{mapping.tsql}</code>
                        <code className="font-mono bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 px-2 py-1 rounded">{mapping.plsql}</code>
                        <div className="text-gray-600">{mapping.usage}</div>
                        <div className="text-gray-500 text-xs">{mapping.notes}</div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="syntax" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Syntax Differences</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-semibold text-sm">
                    <div>Category</div>
                    <div>T-SQL Syntax</div>
                    <div>PL/SQL Syntax</div>
                    <div>Example</div>
                  </div>
                  <ScrollArea className="max-h-96">
                    {syntaxDifferences.map((diff, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-3 border-t text-sm">
                        <div className="font-semibold text-blue-600">{diff.category}</div>
                        <div className="font-mono bg-red-50 px-2 py-1 rounded text-xs">{diff.tsql}</div>
                        <div className="font-mono bg-green-50 px-2 py-1 rounded text-xs">{diff.plsql}</div>
                        <div className="text-gray-600 text-xs">{diff.example}</div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {files.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
              <Tabs defaultValue="tables">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="tables">
                    Tables
                    {getFilteredFiles('table').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('table').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="procedures">
                    Procedures
                    {getFilteredFiles('procedure').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('procedure').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="triggers">
                    Triggers
                    {getFilteredFiles('trigger').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('trigger').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="other">
                    Other
                    {getFilteredFiles('other').length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {getFilteredFiles('other').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                {(['tables', 'procedures', 'triggers', 'other'] as const).map(tabValue => (
                  <TabsContent key={tabValue} value={tabValue}>
                    <ScrollArea className="h-[300px] rounded-md border p-4">
                      {getFilteredFiles(
                        tabValue === 'tables' ? 'table' : 
                        tabValue === 'procedures' ? 'procedure' : 
                        tabValue === 'triggers' ? 'trigger' : 'other'
                      ).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No {tabValue} uploaded yet
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {getFilteredFiles(
                            tabValue === 'tables' ? 'table' : 
                            tabValue === 'procedures' ? 'procedure' : 
                            tabValue === 'triggers' ? 'trigger' : 'other'
                          ).map(file => (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-3 bg-card rounded-md border"
                            >
                              <div className="flex items-center">
                                <File className="h-5 w-5 mr-3 text-muted-foreground" />
                                <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      Set Type
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'table')}>
                                      Table
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'procedure')}>
                                      Procedure
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'trigger')}>
                                      Trigger
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeFileType(file.id, 'other')}>
                                      Other
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRemoveFile(file.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
          
          {/* Validation Error Display */}
          {validationError && (
            <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 font-medium">This is not a T-SQL file</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{validationError}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleContinue}
            disabled={files.length === 0}
          >
            Continue to Conversion
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CodeUploader;
