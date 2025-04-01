
import { ConversionResult, CodeFile, ConversionIssue } from '@/types';

// Simulate AI-based code conversion
export const convertSybaseToOracle = async (file: CodeFile): Promise<ConversionResult> => {
  // In a real implementation, this would call an AI model API
  // For this demo, we'll use a simplified simulation
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate dummy conversion result
  let convertedCode = '';
  const issues: ConversionIssue[] = [];
  
  // Simple simulation of conversion logic based on file type
  if (file.type === 'table') {
    convertedCode = simulateTableConversion(file.content);
  } else if (file.type === 'procedure') {
    convertedCode = simulateProcedureConversion(file.content);
  } else if (file.type === 'trigger') {
    convertedCode = simulateTriggerConversion(file.content);
  } else {
    convertedCode = file.content; // Fallback for other types
    issues.push({
      id: crypto.randomUUID(),
      description: 'Unknown file type, conversion may be incomplete',
      severity: 'warning'
    });
  }
  
  // Add some random issues to simulate the AI detecting potential problems
  if (Math.random() > 0.5) {
    issues.push({
      id: crypto.randomUUID(),
      lineNumber: Math.floor(Math.random() * 20) + 1,
      description: 'Potential data type mismatch',
      severity: 'warning',
      originalCode: 'DATETIME',
      suggestedFix: 'Replace with TIMESTAMP'
    });
  }
  
  return {
    id: crypto.randomUUID(),
    originalFile: file,
    convertedCode,
    issues,
    performance: {
      originalComplexity: Math.floor(Math.random() * 100) + 50,
      convertedComplexity: Math.floor(Math.random() * 50) + 20,
      improvementPercentage: Math.floor(Math.random() * 40) + 10,
      notes: ['Replaced loops with SQL queries', 'Optimized index usage']
    },
    status: issues.some(i => i.severity === 'error') ? 'error' : 
            issues.length > 0 ? 'warning' : 'success'
  };
};

// Simple simulation of table conversion
const simulateTableConversion = (sybaseCode: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    .replace(/IDENTITY/g, 'GENERATED ALWAYS AS IDENTITY')
    .replace(/DATETIME/g, 'TIMESTAMP')
    .replace(/TEXT/g, 'CLOB')
    .replace(/IMAGE/g, 'BLOB')
    .replace(/UNIQUEIDENTIFIER/g, 'RAW(16)')
    .replace(/BIT/g, 'NUMBER(1)');
  
  // Add Oracle-specific formatting
  oracleCode = `-- Oracle converted table definition
${oracleCode}

-- Added Oracle-specific indexes and optimizations
CREATE INDEX idx_tablename_column ON tablename(column);
`;

  return oracleCode;
};

// Simple simulation of stored procedure conversion
const simulateProcedureConversion = (sybaseCode: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    .replace(/CREATE PROCEDURE/g, 'CREATE OR REPLACE PROCEDURE')
    .replace(/DECLARE @/g, '')
    .replace(/@/g, 'v_')
    .replace(/SELECT @\w+ = /g, 'SELECT INTO v_')
    .replace(/PRINT/g, 'DBMS_OUTPUT.PUT_LINE')
    .replace(/BEGIN TRANSACTION/g, 'BEGIN')
    .replace(/COMMIT TRANSACTION/g, 'COMMIT')
    .replace(/ROLLBACK TRANSACTION/g, 'ROLLBACK');
  
  // Wrap in Oracle PL/SQL block
  oracleCode = `-- Oracle converted procedure
CREATE OR REPLACE PROCEDURE procedure_name (
  param1 IN NUMBER,
  param2 IN VARCHAR2
)
AS
BEGIN
${oracleCode}
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END procedure_name;
/`;

  return oracleCode;
};

// Simple simulation of trigger conversion
const simulateTriggerConversion = (sybaseCode: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    .replace(/CREATE TRIGGER/g, 'CREATE OR REPLACE TRIGGER')
    .replace(/ON \w+ (FOR|AFTER) (INSERT|UPDATE|DELETE)/g, 'AFTER $2 ON $1')
    .replace(/REFERENCING OLD AS/g, 'REFERENCING OLD ROW AS')
    .replace(/REFERENCING NEW AS/g, 'REFERENCING NEW ROW AS')
    .replace(/inserted/g, ':new')
    .replace(/deleted/g, ':old');
  
  // Wrap in Oracle trigger syntax
  oracleCode = `-- Oracle converted trigger
CREATE OR REPLACE TRIGGER trigger_name
AFTER INSERT OR UPDATE OR DELETE ON table_name
FOR EACH ROW
BEGIN
${oracleCode}
END;
/`;

  return oracleCode;
};

export const validateOracleCode = (code: string): ConversionIssue[] => {
  // In a real implementation, this would use a parser to validate Oracle syntax
  // For this demo, we'll use a simplified simulation
  const issues: ConversionIssue[] = [];
  
  // Check for common syntax errors
  if (code.includes('@@') || code.includes('@')) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'Potential Sybase variable notation (@) still present',
      severity: 'error',
      originalCode: '@variable',
      suggestedFix: 'v_variable'
    });
  }
  
  if (code.includes('SELECT INTO') && !code.includes('FROM')) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'SELECT INTO missing FROM clause',
      severity: 'error'
    });
  }
  
  return issues;
};

export const generateConversionReport = (results: ConversionResult[]): string => {
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  return `
# Code Conversion Report

## Summary
- **Files Processed**: ${results.length}
- **Successfully Converted**: ${successCount}
- **Converted with Warnings**: ${warningCount}
- **Failed Conversions**: ${errorCount}
- **Overall Success Rate**: ${Math.round((successCount + warningCount) / results.length * 100)}%

## Detailed Findings

${results.map(result => `
### ${result.originalFile.name} (${result.originalFile.type})
- **Status**: ${result.status.toUpperCase()}
- **Issues Found**: ${result.issues.length}
${result.issues.map(issue => `- ${issue.severity.toUpperCase()}: ${issue.description}`).join('\n')}
- **Performance Improvement**: ${result.performance?.improvementPercentage}%
`).join('\n')}

## Recommendations

- Review all warnings and errors manually
- Test the converted code thoroughly
- Consider performance testing for critical procedures
`;
};
