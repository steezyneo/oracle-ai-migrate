export type DatabaseType = 'sybase' | 'oracle';

export interface DatabaseConnection {
  type: DatabaseType;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  connectionString?: string;
}

export interface CodeFile {
  id: string;
  name: string;
  content: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  status?: 'pending' | 'converting' | 'success' | 'error';
}

// New types for multi-database support
export interface FileItem {
  id: string;
  name: string;
  path: string;
  databaseName: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
}

export interface DatabaseNode {
  name: string;
  files: FileItem[];
  children?: DatabaseNode[];
}

export interface FileStructure {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileStructure[];
  databaseName?: string;
  [key: string]: any;
}

export interface ConversionResult {
  id: string;
  originalFile: CodeFile;
  convertedCode: string;
  issues: ConversionIssue[];
  dataTypeMapping?: DataTypeMapping[];
  performance?: PerformanceMetrics;
  status: 'success' | 'warning' | 'error';
  explanations?: string[];
}

export interface ConversionIssue {
  id: string;
  lineNumber?: number;
  description: string;
  severity: 'info' | 'warning' | 'error';
  suggestedFix?: string;
  originalCode?: string;
}

export interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description?: string;
}

export interface PerformanceMetrics {
  originalComplexity?: number;
  convertedComplexity?: number;
  improvementPercentage?: number;
  conversionTimeMs?: number;
  performanceScore?: number;
  maintainabilityIndex?: number;
  codeQuality?: {
    totalLines: number;
    codeLines: number;
    commentRatio: number;
    complexityLevel: 'Low' | 'Medium' | 'High';
  };
  recommendations?: string[];
  notes?: string[];
}

export interface ConversionReport {
  timestamp: string;
  filesProcessed: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  results: ConversionResult[];
  summary: string;
}

export type ConversionStep = 'connection' | 'upload' | 'review' | 'report';

// Re-export unreviewed files types
export * from './unreviewedFiles';
