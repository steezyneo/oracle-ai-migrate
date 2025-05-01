
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadCloud, File, Trash2, Plus } from 'lucide-react';
import { CodeFile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CodeUploaderProps {
  onComplete: (files: CodeFile[]) => void;
}

const CodeUploader: React.FC<CodeUploaderProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'procedures' | 'triggers' | 'other'>('tables');
  const [manualContent, setManualContent] = useState<string>('');
  const [manualFileName, setManualFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const processFiles = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    
    // Convert FileList to array and process each file
    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const content = e.target.result as string;
          const newFile: CodeFile = {
            id: crypto.randomUUID(),
            name: file.name,
            content: content,
            type: determineFileType(file.name, content),
            status: 'pending'
          };
          
          setFiles(prevFiles => [...prevFiles, newFile]);
          
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
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // Reset the input field to allow uploading the same file again
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
    processFiles(dt.files);
  };
  
  const handleDropAreaClick = () => {
    // Trigger the hidden file input's click event
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const determineFileType = (fileName: string, content: string): 'table' | 'procedure' | 'trigger' | 'other' => {
    fileName = fileName.toLowerCase();
    content = content.toLowerCase();
    
    // Check file extension first
    if (fileName.includes('table') || fileName.includes('tbl') || fileName.endsWith('.tab')) {
      return 'table';
    } else if (fileName.includes('proc') || fileName.includes('sp_') || fileName.endsWith('.prc')) {
      return 'procedure';
    } else if (fileName.includes('trig') || fileName.includes('tr_') || fileName.endsWith('.trg')) {
      return 'trigger';
    }
    
    // If extension doesn't clearly indicate, analyze content
    if (fileName.endsWith('.sql')) {
      // Check for table creation patterns
      if (content.includes('create table') || 
          content.includes('alter table') || 
          content.match(/\bcreate\s+.*\s+table\b/i)) {
        return 'table';
      }
      
      // Check for procedure patterns
      if (content.includes('create procedure') || 
          content.includes('create or replace procedure') || 
          content.includes('create proc')) {
        return 'procedure';
      }
      
      // Check for trigger patterns
      if (content.includes('create trigger') || 
          content.includes('create or replace trigger') || 
          content.match(/\btrigger\s+on\b/i)) {
        return 'trigger';
      }
    }
    
    // Default fallback if no clear indication
    return 'other';
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
    
    const newFile: CodeFile = {
      id: crypto.randomUUID(),
      name: manualFileName,
      content: manualContent,
      type: determineFileType(manualFileName, manualContent),
      status: 'pending'
    };
    
    setFiles(prevFiles => [...prevFiles, newFile]);
    
    // Reset form
    setManualContent('');
    setManualFileName('');
    
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
    const fileName = type === 'table' ? 'example_table.tab' : 
                    type === 'procedure' ? 'example_procedure.prc' : 
                    'example_trigger.trg';
    
    setManualFileName(fileName);
    setManualContent(template);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Sybase Code</CardTitle>
          <CardDescription>
            Upload your Sybase database objects for conversion to Oracle.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div 
            className={`mb-8 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
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
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button variant="secondary">Select Files</Button>
              <Input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept=".sql,.txt,.tab,.prc,.trg"
                ref={fileInputRef}
              />
            </Label>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Or Paste Code Directly</h3>
            <div className="grid gap-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="manual-filename" className="mb-2">Filename</Label>
                  <Input
                    id="manual-filename"
                    value={manualFileName}
                    onChange={(e) => setManualFileName(e.target.value)}
                    placeholder="e.g., customers_table.sql"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => addTemplateCode('table')}>
                      Table Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addTemplateCode('procedure')}>
                      Procedure Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addTemplateCode('trigger')}>
                      Trigger Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <Label htmlFor="manual-content" className="mb-2">Code Content</Label>
                <Textarea
                  id="manual-content"
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste your Sybase code here..."
                  className="font-mono min-h-[200px]"
                />
              </div>
              <Button onClick={handleManualSubmit}>Add File</Button>
            </div>
          </div>
          
          {files.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Uploaded Files</h3>
              <Tabs defaultValue="tables" onValueChange={(value) => setActiveTab(value as any)}>
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
                              <div className="flex items-center">
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
