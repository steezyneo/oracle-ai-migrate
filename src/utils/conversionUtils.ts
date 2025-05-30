
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
  
  // Validate converted code
  const validationIssues = validateOracleCode(convertedCode);
  issues.push(...validationIssues);
  
  // Add some random issues to simulate the AI detecting potential problems
  if (Math.random() > (aiModel === 'gemini' ? 0.7 : 0.5)) {
    issues.push({
      id: crypto.randomUUID(),
      lineNumber: Math.floor(Math.random() * 20) + 1,
      description: 'Potential data type mismatch',
      severity: 'warning',
      originalCode: 'DECIMAL(10,2)',
      suggestedFix: 'NUMBER(10,2)'
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

// Enhanced table conversion with more Sybase-specific patterns
const simulateTableConversion = (sybaseCode: string): string => {
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    // Data type conversions
    .replace(/\bBIT\b/gi, 'NUMBER(1)')
    .replace(/\bTINYINT\b/gi, 'NUMBER(3)')
    .replace(/\bSMALLINT\b/gi, 'NUMBER(5)')
    .replace(/\bINT\b/gi, 'NUMBER(10)')
    .replace(/\bBIGINT\b/gi, 'NUMBER(19)')
    .replace(/\bDECIMAL\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'NUMBER($1,$2)')
    .replace(/\bNUMERIC\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'NUMBER($1,$2)')
    .replace(/\bMONEY\b/gi, 'NUMBER(19,4)')
    .replace(/\bSMALLMONEY\b/gi, 'NUMBER(10,4)')
    .replace(/\bFLOAT\b/gi, 'FLOAT')
    .replace(/\bREAL\b/gi, 'BINARY_FLOAT')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
    .replace(/\bSMALLDATETIME\b/gi, 'TIMESTAMP')
    .replace(/\bTEXT\b/gi, 'CLOB')
    .replace(/\bNTEXT\b/gi, 'NCLOB')
    .replace(/\bIMAGE\b/gi, 'BLOB')
    .replace(/\bVARCHAR\s*\(\s*(\d+)\s*\)/gi, 'VARCHAR2($1)')
    .replace(/\bCHAR\s*\(\s*(\d+)\s*\)/gi, 'CHAR($1)')
    .replace(/\bNVARCHAR\s*\(\s*(\d+)\s*\)/gi, 'NVARCHAR2($1)')
    .replace(/\bUNIQUEIDENTIFIER\b/gi, 'RAW(16)')
    // Identity columns
    .replace(/IDENTITY\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'GENERATED BY DEFAULT AS IDENTITY (START WITH $1 INCREMENT BY $2)')
    .replace(/\bIDENTITY\b/gi, 'GENERATED ALWAYS AS IDENTITY')
    // Null handling
    .replace(/\bIS NULL\b/gi, 'IS NULL')
    .replace(/\bIS NOT NULL\b/gi, 'IS NOT NULL')
    // Add constraint and index syntax conversions
    .replace(/\bPRIMARY KEY\s+CLUSTERED\b/gi, 'PRIMARY KEY')
    .replace(/\bPRIMARY KEY\s+NONCLUSTERED\b/gi, 'PRIMARY KEY')
    .replace(/\bCREATE\s+CLUSTERED\s+INDEX\b/gi, 'CREATE INDEX')
    .replace(/\bCREATE\s+NONCLUSTERED\s+INDEX\b/gi, 'CREATE INDEX')
    .replace(/\bCREATE\s+UNIQUE\s+CLUSTERED\s+INDEX\b/gi, 'CREATE UNIQUE INDEX')
    .replace(/\bCREATE\s+UNIQUE\s+NONCLUSTERED\s+INDEX\b/gi, 'CREATE UNIQUE INDEX')
    // Default values
    .replace(/DEFAULT\s+getdate\(\)/gi, 'DEFAULT SYSDATE')
    .replace(/DEFAULT\s+CURRENT_TIMESTAMP/gi, 'DEFAULT SYSTIMESTAMP')
    // Table options and storage
    .replace(/ON\s+\[PRIMARY\]/gi, '')
    .replace(/WITH\s*\(\s*[^)]*\)/gi, '')
    .replace(/TEXTIMAGE_ON\s+\[PRIMARY\]/gi, '')
    .replace(/ON\s+\w+(\.\w+)?/gi, '');

  // Add Oracle-specific formatting and comments
  oracleCode = `
-- Converted from Sybase to Oracle syntax
${oracleCode}
`;

  return oracleCode;
};

// Enhanced stored procedure conversion
const simulateProcedureConversion = (sybaseCode: string): string => {
  // Extract procedure name or use default
  const procName = extractProcedureName(sybaseCode) || 'converted_proc';
  
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    // Structure conversions - remove CREATE PROCEDURE as we'll add it later
    .replace(/CREATE\s+PROCEDURE\s+\w+/gi, '')
    // Variable declarations and assignments
    .replace(/@(\w+)/g, 'v_$1')
    .replace(/DECLARE\s+@(\w+)\s+([^,;]+)/gi, 'v_$1 $2')
    .replace(/SET\s+@(\w+)\s*=\s*/gi, 'v_$1 := ')
    .replace(/SELECT\s+@(\w+)\s*=\s*/gi, 'SELECT INTO v_$1 ')
    // Flow control
    .replace(/IF\s+(.+)\s+BEGIN/gi, 'IF $1 THEN')
    .replace(/\bELSE\s+BEGIN\b/gi, 'ELSE')
    .replace(/\bEND\b/gi, 'END IF;')
    .replace(/WHILE\s+(.+)\s+BEGIN/gi, 'WHILE $1 LOOP')
    .replace(/END\s+WHILE/gi, 'END LOOP;')
    // Sybase specific commands
    .replace(/PRINT\s+/gi, 'DBMS_OUTPUT.PUT_LINE(')
    .replace(/PRINT\s+'([^']*)'/gi, "DBMS_OUTPUT.PUT_LINE('$1')")
    .replace(/GO\b/gi, '/')
    // Error handling 
    .replace(/@@ERROR/gi, 'SQLCODE')
    .replace(/@@ROWCOUNT/gi, 'SQL%ROWCOUNT')
    .replace(/@@IDENTITY/gi, 'your_sequence.CURRVAL')
    // Transaction management
    .replace(/BEGIN\s+TRANSACTION/gi, 'BEGIN')
    .replace(/COMMIT\s+TRANSACTION/gi, 'COMMIT')
    .replace(/ROLLBACK\s+TRANSACTION/gi, 'ROLLBACK')
    // Data type conversions
    .replace(/\bINT\b/gi, 'NUMBER(10)')
    .replace(/\bVARCHAR\s*\(\s*(\d+)\s*\)/gi, 'VARCHAR2($1)')
    .replace(/\bDECIMAL\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'NUMBER($1,$2)')
    .replace(/\bTINYINT\b/gi, 'NUMBER(3)')
    .replace(/\bSMALLINT\b/gi, 'NUMBER(5)')
    .replace(/\bBIGINT\b/gi, 'NUMBER(19)')
    .replace(/\bCHAR\s*\(\s*(\d+)\s*\)/gi, 'CHAR($1)')
    .replace(/\bTEXT\b/gi, 'CLOB')
    .replace(/\bgetdate\(\)/gi, 'SYSDATE');

  // Handle control flow statement endings
  oracleCode = oracleCode
    .replace(/\bBEGIN\b(?!\s+TRANSACTION)/gi, 'BEGIN')
    .replace(/\bEND\b(?!\s+IF)(?!\s+LOOP)/gi, 'END;');

  // Wrap in Oracle PL/SQL block
  oracleCode = `
-- Converted from Sybase to Oracle PL/SQL syntax

CREATE OR REPLACE PROCEDURE ${procName}
AS
BEGIN
  ${oracleCode}
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Error: ' || SQLERRM);
    ROLLBACK;
    RAISE;
END;
/
`;

  return oracleCode;
};

// Enhanced trigger conversion
const simulateTriggerConversion = (sybaseCode: string): string => {
  // Extract trigger name or use default
  const trigName = extractTriggerName(sybaseCode) || 'converted_trg';
  
  // Replace Sybase-specific syntax with Oracle equivalents
  let oracleCode = sybaseCode
    // Structure conversions - remove CREATE TRIGGER as we'll add it later
    .replace(/CREATE\s+TRIGGER\s+\w+/gi, '')
    .replace(/ON\s+(\w+)\s+(FOR|AFTER)\s+(INSERT|UPDATE|DELETE)/gi, 'AFTER $3 ON $1')
    .replace(/INSTEAD\s+OF\s+(INSERT|UPDATE|DELETE)\s+ON\s+(\w+)/gi, 'INSTEAD OF $1 ON $2')
    .replace(/FOR\s+EACH\s+ROW/gi, 'FOR EACH ROW')
    // Special tables
    .replace(/inserted/gi, ':new')
    .replace(/deleted/gi, ':old')
    // Variable declarations
    .replace(/@(\w+)/g, 'v_$1')
    .replace(/DECLARE\s+@(\w+)\s+([^,;]+)/gi, 'v_$1 $2')
    .replace(/SET\s+@(\w+)\s*=\s*/gi, 'v_$1 := ')
    .replace(/SELECT\s+@(\w+)\s*=\s*/gi, 'SELECT INTO v_$1 ')
    // Flow control
    .replace(/IF\s+(.+)\s+BEGIN/gi, 'IF $1 THEN')
    .replace(/ELSE\s+BEGIN/gi, 'ELSE')
    .replace(/END\s+IF/gi, 'END IF;')
    // Data type conversions (same as procedures)
    .replace(/\bINT\b/gi, 'NUMBER(10)')
    .replace(/\bVARCHAR\s*\(\s*(\d+)\s*\)/gi, 'VARCHAR2($1)')
    .replace(/\bDECIMAL\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, 'NUMBER($1,$2)')
    .replace(/\bBIT\b/gi, 'NUMBER(1)')
    .replace(/\bTEXT\b/gi, 'CLOB')
    // Date functions
    .replace(/\bgetdate\(\)/gi, 'SYSDATE')
    .replace(/\bGETDATE\(\)/gi, 'SYSDATE')
    // Handle GO batch separator
    .replace(/GO\b/gi, '/');

  // Handle control flow statement endings
  oracleCode = oracleCode
    .replace(/\bBEGIN\b(?!\s+TRANSACTION)/gi, 'BEGIN')
    .replace(/\bEND\b(?!\s+IF)/gi, 'END;');

  // Wrap in Oracle trigger syntax
  oracleCode = `
-- Converted from Sybase to Oracle syntax

CREATE OR REPLACE TRIGGER ${trigName}
${oracleCode}
EXCEPTION
  WHEN OTHERS THEN
    RAISE_APPLICATION_ERROR(-20001, 'Trigger error: ' || SQLERRM);
END;
/
`;

  return oracleCode;
};

// Helper functions for extracting names
const extractProcedureName = (code: string): string | null => {
  const match = code.match(/CREATE\s+(?:OR\s+REPLACE\s+)?PROCEDURE\s+(\w+)/i);
  return match ? match[1] : null;
};

const extractTriggerName = (code: string): string | null => {
  const match = code.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+(\w+)/i);
  return match ? match[1] : null;
};

export const validateOracleCode = (code: string): ConversionIssue[] => {
  const issues: ConversionIssue[] = [];
  
  // Check for common syntax errors and data type mismatches
  if (code.match(/\bINT\b/i)) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'INT is not an Oracle data type, use NUMBER instead',
      severity: 'error',
      originalCode: 'INT',
      suggestedFix: 'NUMBER(10)'
    });
  }
  
  if (code.match(/\bVARCHAR\s*\(/i)) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'VARCHAR is not an Oracle data type, use VARCHAR2 instead',
      severity: 'error',
      originalCode: 'VARCHAR',
      suggestedFix: 'VARCHAR2'
    });
  }
  
  if (code.match(/\bDECIMAL\s*\(\s*\d+\s*,\s*\d+\s*\)/i)) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'DECIMAL is not preferred in Oracle, use NUMBER instead',
      severity: 'warning',
      originalCode: 'DECIMAL(10,2)',
      suggestedFix: 'NUMBER(10,2)'
    });
  }
  
  if (code.includes('@')) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'Sybase variable notation (@) needs to be converted to Oracle style',
      severity: 'error',
      originalCode: '@variable',
      suggestedFix: 'v_variable'
    });
  }
  
  if (code.match(/\bGO\b/i)) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'GO batch separator not used in Oracle, use "/" instead',
      severity: 'error',
      originalCode: 'GO',
      suggestedFix: '/'
    });
  }
  
  if (code.match(/\bgetdate\(\)/i)) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'getdate() function not available in Oracle, use SYSDATE instead',
      severity: 'error',
      originalCode: 'getdate()',
      suggestedFix: 'SYSDATE'
    });
  }
  
  if (code.match(/\bPRINT\b/i)) {
    issues.push({
      id: crypto.randomUUID(),
      description: 'PRINT statement not available in Oracle, use DBMS_OUTPUT.PUT_LINE instead',
      severity: 'error',
      originalCode: 'PRINT',
      suggestedFix: 'DBMS_OUTPUT.PUT_LINE'
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
