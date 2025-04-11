
import { ConversionResult, CodeFile, ConversionIssue } from '@/types';

// Simulate AI-based code conversion
export const convertSybaseToOracle = async (file: CodeFile, aiModel: string = 'default'): Promise<ConversionResult> => {
  // In a real implementation, this would call an AI model API
  // For this demo, we'll use a simplified simulation
  
  console.log(`Converting with ${aiModel} AI model`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Generate dummy conversion result
  let convertedCode = '';
  const issues: ConversionIssue[] = [];
  
  // Simple simulation of conversion logic based on file type and AI model
  if (file.type === 'table') {
    convertedCode = simulateTableConversion(file.content, aiModel);
  } else if (file.type === 'procedure') {
    convertedCode = simulateProcedureConversion(file.content, aiModel);
  } else if (file.type === 'trigger') {
    convertedCode = simulateTriggerConversion(file.content, aiModel);
  } else {
    convertedCode = file.content; // Fallback for other types
    issues.push({
      id: crypto.randomUUID(),
      description: 'Unknown file type, conversion may be incomplete',
      severity: 'warning'
    });
  }
  
  // Add some random issues to simulate the AI detecting potential problems
  // Gemini should have fewer issues on average
  if (Math.random() > (aiModel === 'gemini' ? 0.7 : 0.5)) {
    issues.push({
      id: crypto.randomUUID(),
      lineNumber: Math.floor(Math.random() * 20) + 1,
      description: 'Potential data type mismatch',
      severity: 'warning',
      originalCode: 'DECIMAL(10,2)',
      suggestedFix: 'Replace with NUMBER(10,2)'
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
      improvementPercentage: aiModel === 'gemini' ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 40) + 10,
      notes: ['Replaced loops with SQL queries', 'Optimized index usage']
    },
    status: issues.some(i => i.severity === 'error') ? 'error' : 
            issues.length > 0 ? 'warning' : 'success'
  };
};

// Simple simulation of table conversion
const simulateTableConversion = (sybaseCode: string, aiModel: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    .replace(/IDENTITY/g, 'GENERATED ALWAYS AS IDENTITY')
    .replace(/DATETIME/g, 'TIMESTAMP')
    .replace(/TEXT/g, 'CLOB')
    .replace(/IMAGE/g, 'BLOB')
    .replace(/UNIQUEIDENTIFIER/g, 'RAW(16)')
    .replace(/BIT/g, 'NUMBER(1)')
    .replace(/INT/g, 'NUMBER')
    .replace(/VARCHAR\(/g, 'VARCHAR2(')
    .replace(/DECIMAL\((\d+),(\d+)\)/g, 'NUMBER($1,$2)');
  
  // Add Oracle-specific formatting
  oracleCode = `-- Oracle converted table definition with ${aiModel} AI
${oracleCode}

-- Added Oracle-specific indexes and optimizations
CREATE INDEX idx_tablename_column ON tablename(column);
`;

  if (aiModel === 'gemini') {
    oracleCode += `
-- Gemini AI added performance optimizations
ALTER TABLE tablename ADD CONSTRAINT pk_tablename PRIMARY KEY (id);
COMMENT ON TABLE tablename IS 'Converted from Sybase by Gemini AI';
`;
  }

  return oracleCode;
};

// Simple simulation of stored procedure conversion
const simulateProcedureConversion = (sybaseCode: string, aiModel: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    .replace(/CREATE PROCEDURE/g, 'CREATE OR REPLACE PROCEDURE')
    .replace(/DECLARE @/g, '')
    .replace(/@/g, 'v_')
    .replace(/SELECT @\w+ = /g, 'SELECT INTO v_')
    .replace(/PRINT/g, 'DBMS_OUTPUT.PUT_LINE')
    .replace(/BEGIN TRANSACTION/g, 'BEGIN')
    .replace(/COMMIT TRANSACTION/g, 'COMMIT')
    .replace(/ROLLBACK TRANSACTION/g, 'ROLLBACK')
    .replace(/INT/g, 'NUMBER')
    .replace(/VARCHAR\(/g, 'VARCHAR2(')
    .replace(/DECIMAL\((\d+),(\d+)\)/g, 'NUMBER($1,$2)');
  
  // Wrap in Oracle PL/SQL block
  oracleCode = `-- Oracle converted procedure with ${aiModel} AI
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

  if (aiModel === 'gemini') {
    oracleCode = oracleCode.replace('EXCEPTION', `
  -- Gemini AI added performance optimizations
  COMMIT;
EXCEPTION`);
  }

  return oracleCode;
};

// Simple simulation of trigger conversion
const simulateTriggerConversion = (sybaseCode: string, aiModel: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    .replace(/CREATE TRIGGER/g, 'CREATE OR REPLACE TRIGGER')
    .replace(/ON \w+ (FOR|AFTER) (INSERT|UPDATE|DELETE)/g, 'AFTER $2 ON $1')
    .replace(/REFERENCING OLD AS/g, 'REFERENCING OLD ROW AS')
    .replace(/REFERENCING NEW AS/g, 'REFERENCING NEW ROW AS')
    .replace(/inserted/g, ':new')
    .replace(/deleted/g, ':old')
    .replace(/INT/g, 'NUMBER')
    .replace(/VARCHAR\(/g, 'VARCHAR2(')
    .replace(/DECIMAL\((\d+),(\d+)\)/g, 'NUMBER($1,$2)');
  
  // Wrap in Oracle trigger syntax
  oracleCode = `-- Oracle converted trigger with ${aiModel} AI
CREATE OR REPLACE TRIGGER trigger_name
AFTER INSERT OR UPDATE OR DELETE ON table_name
FOR EACH ROW
BEGIN
${oracleCode}
END;
/`;

  if (aiModel === 'gemini') {
    oracleCode = oracleCode.replace('BEGIN', `BEGIN
  -- Gemini AI added exception handling
  PRAGMA AUTONOMOUS_TRANSACTION;`);
    
    oracleCode = oracleCode.replace('END;', `EXCEPTION
  WHEN OTHERS THEN
    -- Gemini AI added logging
    DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
    RAISE;
END;`);
  }

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
  
  // Check for incorrect Oracle data types
  if (code.includes('VARCHAR(')) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'VARCHAR is not an Oracle data type, use VARCHAR2 instead',
      severity: 'error',
      originalCode: 'VARCHAR',
      suggestedFix: 'VARCHAR2'
    });
  }
  
  if (code.includes('DECIMAL(')) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'DECIMAL is not preferred in Oracle, use NUMBER instead',
      severity: 'warning',
      originalCode: 'DECIMAL(10,2)',
      suggestedFix: 'NUMBER(10,2)'
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
