// Supported database types for migration
export type DatabaseType = 'sybase' | 'oracle';

// Connection details for a database (Sybase or Oracle)
export interface DatabaseConnection {
  type: DatabaseType;
  host: string;
  port: string;
  username: string;
  password: string;
  database: string;
  connectionString?: string; // Optional: for direct connection strings
}

// Represents a file to be converted (table, procedure, etc.)
export interface CodeFile {
  id: string;
  name: string;
  content: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  status?: 'pending' | 'converting' | 'success' | 'error';
}

// Result of a single file conversion
export interface ConversionResult {
  id: string;
  originalFile: CodeFile;
  convertedCode: string;
  issues: ConversionIssue[];
  dataTypeMapping?: DataTypeMapping[];
  performance?: PerformanceMetrics;
  status: 'success' | 'warning' | 'error';
  explanations?: string[]; // Optional: AI explanations for the conversion
}

// Issue found during conversion (error, warning, or info)
export interface ConversionIssue {
  id: string;
  lineNumber?: number;
  description: string;
  severity: 'info' | 'warning' | 'error';
  suggestedFix?: string;
  originalCode?: string;
  explanation?: string;
}

// Mapping from Sybase to Oracle data types
export interface DataTypeMapping {
  sybaseType: string;
  oracleType: string;
  description?: string; // Optional: notes about the mapping
}

// Metrics about code quality and performance after conversion
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

// Summary report for a batch of conversions
export interface ConversionReport {
  timestamp: string;
  filesProcessed: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  results: ConversionResult[];
  summary: string; // Human-readable summary
}

// Steps in the conversion UI flow
export type ConversionStep = 'connection' | 'upload' | 'review' | 'report';

// Re-export unreviewed files types for convenience
export * from './unreviewedFiles';

// Main file item used throughout the app (extends CodeFile with more fields)
export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'table' | 'procedure' | 'trigger' | 'other';
  content: string;
  conversionStatus: 'pending' | 'success' | 'failed' | 'pending_review';
  convertedContent?: string;
  errorMessage?: string;
  dataTypeMapping?: DataTypeMapping[];
  issues?: ConversionIssue[];
  performanceMetrics?: PerformanceMetrics;
  explanations?: string[];
  // Collaboration/Review fields
  reviewStatus?: 'pending' | 'approved' | 'changes_requested';
  reviewerId?: string;
  reviewComments?: ReviewComment[];
  assignedTo?: string;
}

// Comment left by a reviewer on a file
export interface ReviewComment {
  id: string;
  userId: string;
  userName?: string;
  comment: string;
  createdAt: string;
}
