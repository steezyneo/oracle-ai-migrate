import { ConversionResult, CodeFile, ConversionIssue, DataTypeMapping } from '@/types';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import crypto from 'crypto';

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Enhanced AI-based code conversion with comprehensive Sybase to Oracle rules
export const convertSybaseToOracle = async (
  file: CodeFile,
  aiModel: string = 'default',
  customPrompt?: string,
  skipExplanation: boolean = true
): Promise<ConversionResult> => {
  // Check cache first
  const contentHash = hashContent(file.content);
  const { data: cached, error: cacheError } = await supabase
    .from('conversion_cache')
    .select('converted_code')
    .eq('content_hash', contentHash)
    .single();
  if (cached && cached.converted_code) {
    return {
      id: uuidv4(),
      originalFile: file,
      convertedCode: cached.converted_code,
      issues: [],
      dataTypeMapping: [],
      performance: {},
      status: 'success',
      explanations: ['Result from cache.'],
    };
  }

  console.log(`[CONVERT] Starting conversion for file: ${file.name} with model: ${aiModel}`);
  const startTime = Date.now();

  // Extract data type mappings from original code
  const dataTypeMapping = extractDataTypeMappings(file.content);

  // Analyze code complexity before conversion
  const originalComplexity = analyzeCodeComplexity(file.content);

  // Use custom prompt if provided, otherwise use default
  const prompt = customPrompt && customPrompt.trim().length > 0
    ? `${customPrompt}\n\nSybase code:\n${file.content}`
    : `Convert the following Sybase SQL code to Oracle PL/SQL. Ensure 100% accuracy and best practices. Output only the converted Oracle code.\n\nSybase code:\n${file.content}`;
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  let convertedCode = '';
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    convertedCode = response.text().replace(/^```[a-zA-Z]*|```$/g, '').trim();
  } catch (e) {
    console.error(`[CONVERT] Error converting file: ${file.name}`, e);
    throw new Error(`Conversion failed for file: ${file.name}`);
  }

  const conversionTime = Date.now() - startTime;

  // Analyze converted code complexity
  const convertedComplexity = analyzeCodeComplexity(convertedCode);

  // Generate quantitative performance analysis
  const performanceMetrics = generatePerformanceMetrics(
    originalComplexity,
    convertedComplexity,
    conversionTime,
    file.content,
    convertedCode
  );

  // Generate issues based on quantitative analysis
  const issues: ConversionIssue[] = generateQuantitativeIssues(
    originalComplexity,
    convertedComplexity,
    file.content,
    convertedCode
  );

  // Optionally skip AI explanation for speed
  let explanations: string[] = [];
  if (!skipExplanation) {
    try {
      const explanationPrompt = `Explain the main changes and rationale for converting the following Sybase SQL code to Oracle PL/SQL. Highlight any complex rewrites, data type changes, and best practices applied.\n\nSybase code:\n${file.content}\n\nOracle code:\n${convertedCode}`;
      const explanationResult = await model.generateContent(explanationPrompt);
      const explanationResponse = await explanationResult.response;
      const explanationText = explanationResponse.text().replace(/^```[a-zA-Z]*|```$/g, '').trim();
      explanations = [explanationText];
    } catch (e) {
      explanations = ["Explanation not available due to an error."];
    }
  }

  // After conversion, store in cache
  await supabase.from('conversion_cache').insert([
    {
      content_hash: contentHash,
      original_code: file.content,
      converted_code: convertedCode,
    }
  ]);

  console.log(`[CONVERT] Success for file: ${file.name} in ${conversionTime}ms`);
  return {
    id: uuidv4(),
    originalFile: file,
    convertedCode,
    issues,
    dataTypeMapping,
    performance: performanceMetrics,
    status: issues.some(i => i.severity === 'error') ? 'error' : 
            issues.length > 0 ? 'warning' : 'success',
    explanations,
  };
};

// Convert multiple files in parallel with support for customPrompt and skipExplanation
export const convertMultipleFiles = async (
  files: CodeFile[],
  aiModel: string = 'default',
  customPrompt?: string,
  skipExplanation: boolean = true
): Promise<ConversionResult[]> => {
  // Map each file to a conversion promise using the improved convertSybaseToOracle
  const conversionPromises = files.map(file =>
    convertSybaseToOracle(file, aiModel, customPrompt, skipExplanation)
  );
  return Promise.all(conversionPromises);
};

// Helper: extract data type mappings from code
const extractDataTypeMappings = (code: string): DataTypeMapping[] => {
  const mappings: DataTypeMapping[] = [];
  const sybaseTypes = [
    // Numeric types
    { pattern: /\bint\b/gi, oracle: 'NUMBER(10)', desc: 'Integer type' },
    { pattern: /\bsmallint\b/gi, oracle: 'NUMBER(5)', desc: 'Small integer type' },
    { pattern: /\bbigint\b/gi, oracle: 'NUMBER(19)', desc: 'Big integer type' },
    { pattern: /\btinyint\b/gi, oracle: 'NUMBER(3)', desc: 'Tiny integer type' },
    { pattern: /\bdecimal\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, oracle: 'NUMBER($1,$2)', desc: 'Decimal with precision and scale' },
    { pattern: /\bnumeric\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, oracle: 'NUMBER($1,$2)', desc: 'Numeric with precision and scale' },
    { pattern: /\bfloat\b/gi, oracle: 'BINARY_FLOAT', desc: 'Floating point number' },
    { pattern: /\breal\b/gi, oracle: 'BINARY_FLOAT', desc: 'Real number' },
    { pattern: /\bmoney\b/gi, oracle: 'NUMBER(19,4)', desc: 'Money type' },
    { pattern: /\bsmallmoney\b/gi, oracle: 'NUMBER(10,4)', desc: 'Small money type' },
    
    // Character types
    { pattern: /\bchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'CHAR($1)', desc: 'Fixed-length character string' },
    { pattern: /\bvarchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'VARCHAR2($1)', desc: 'Variable-length character string' },
    { pattern: /\bnchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'NCHAR($1)', desc: 'Fixed-length Unicode string' },
    { pattern: /\bnvarchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'NVARCHAR2($1)', desc: 'Variable-length Unicode string' },
    { pattern: /\btext\b/gi, oracle: 'CLOB', desc: 'Large text data' },
    { pattern: /\bntext\b/gi, oracle: 'NCLOB', desc: 'Large Unicode text data' },
    
    // Binary types
    { pattern: /\bbinary\s*\(\s*(\d+)\s*\)/gi, oracle: 'RAW($1)', desc: 'Fixed-length binary data' },
    { pattern: /\bvarbinary\s*\(\s*(\d+)\s*\)/gi, oracle: 'RAW($1)', desc: 'Variable-length binary data' },
    { pattern: /\bimage\b/gi, oracle: 'BLOB', desc: 'Large binary data' },
    
    // Date/Time types
    { pattern: /\bdatetime\b/gi, oracle: 'TIMESTAMP', desc: 'Date and time' },
    { pattern: /\bsmalldatetime\b/gi, oracle: 'TIMESTAMP', desc: 'Small date and time' },
    { pattern: /\bdate\b/gi, oracle: 'DATE', desc: 'Date only' },
    { pattern: /\btime\b/gi, oracle: 'TIMESTAMP', desc: 'Time only' },
    { pattern: /\btimestamp\b/gi, oracle: 'TIMESTAMP', desc: 'Timestamp' },
    
    // Boolean type
    { pattern: /\bbit\b/gi, oracle: 'NUMBER(1)', desc: 'Boolean type (0 or 1)' },
    
    // Other types
    { pattern: /\buniqueidentifier\b/gi, oracle: 'RAW(16)', desc: 'Unique identifier' },
    { pattern: /\bsql_variant\b/gi, oracle: 'VARCHAR2(4000)', desc: 'SQL variant type' },
    { pattern: /\bxml\b/gi, oracle: 'XMLTYPE', desc: 'XML data type' }
  ];

  const foundTypes = new Set<string>();
  
  sybaseTypes.forEach(({ pattern, oracle, desc }) => {
    const matches = code.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const sybaseType = match.toLowerCase();
        if (!foundTypes.has(sybaseType)) {
          foundTypes.add(sybaseType);
          
          // Handle parameterized types
          let oracleType = oracle;
          if (match.includes('(')) {
            const params = match.match(/\(([^)]+)\)/);
            if (params) {
              oracleType = oracle.replace(/\$(\d+)/g, (_, index) => {
                const parts = params[1].split(',').map(p => p.trim());
                return parts[parseInt(index) - 1] || '255';
              });
            }
          }
          
          mappings.push({
            sybaseType: match,
            oracleType: oracleType,
            description: desc
          });
        }
      });
    }
  });

  return mappings;
};

// Analyze code complexity quantitatively
const analyzeCodeComplexity = (code: string) => {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const commentLines = lines.filter(line => line.trim().startsWith('--') || line.trim().startsWith('/*')).length;
  const emptyLines = lines.filter(line => line.trim() === '').length;
  const codeLines = totalLines - commentLines - emptyLines;
  
  // Calculate cyclomatic complexity (simplified)
  const controlStructures = (code.match(/\b(if|while|for|case|when|loop)\b/gi) || []).length;
  const functions = (code.match(/\b(create|procedure|function|trigger)\b/gi) || []).length;
  const complexity = controlStructures + functions + 1;
  
  // Calculate maintainability index
  let maintainabilityIndex = 171 - 5.2 * Math.log(complexity) - 0.23 * Math.log(codeLines) - 16.2 * Math.log(commentLines + 1);
  maintainabilityIndex = Math.max(0, Math.min(100, maintainabilityIndex));
  
  return {
    totalLines,
    codeLines,
    commentLines,
    emptyLines,
    controlStructures,
    functions,
    cyclomaticComplexity: complexity,
    maintainabilityIndex: Math.round(maintainabilityIndex),
    commentRatio: commentLines / totalLines,
    codeDensity: codeLines / totalLines
  };
};

// Analyze loops in code
const analyzeLoops = (code: string) => {
  const loopPatterns = [
    /\bwhile\s+/gi,
    /\bfor\s+/gi,
    /\bloop\b/gi,
    /\bcursor\s+for\s+/gi,
    /\bopen\s+.*\s+for\s+/gi
  ];
  
  let totalLoops = 0;
  loopPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      totalLoops += matches.length;
    }
  });
  
  return totalLoops;
};

// Generate quantitative performance metrics
const generatePerformanceMetrics = (
  originalComplexity: any,
  convertedComplexity: any,
  conversionTime: number,
  originalCode: string,
  convertedCode: string
) => {
  const improvementPercentage = Math.round(
    ((originalComplexity.maintainabilityIndex - convertedComplexity.maintainabilityIndex) / originalComplexity.maintainabilityIndex) * 100
  );
  
  // Calculate lines reduced
  const originalLines = originalComplexity.totalLines;
  const convertedLines = convertedComplexity.totalLines;
  const linesReduced = originalLines - convertedLines;
  
  // Calculate loops reduced
  const originalLoops = analyzeLoops(originalCode);
  const convertedLoops = analyzeLoops(convertedCode);
  const loopsReduced = originalLoops - convertedLoops;
  
  const recommendations = [];
  
  if (convertedComplexity.cyclomaticComplexity > 10) {
    recommendations.push('Consider breaking down complex procedures into smaller functions');
  }
  
  if (convertedComplexity.commentRatio < 0.1) {
    recommendations.push('Add more comments to improve code maintainability');
  }
  
  if (convertedComplexity.codeLines > 100) {
    recommendations.push('Consider modularizing large code blocks');
  }
  
  // Add specific recommendations based on performance metrics
  if (linesReduced > 0) {
    recommendations.push(`Code optimization: ${linesReduced} lines reduced`);
  }
  
  if (loopsReduced > 0) {
    recommendations.push(`Loop optimization: ${loopsReduced} loops reduced`);
  }
  
  const performanceScore = Math.round(
    (convertedComplexity.maintainabilityIndex / 100) * 100
  );
  
  return {
    originalComplexity: originalComplexity.cyclomaticComplexity,
    convertedComplexity: convertedComplexity.cyclomaticComplexity,
    improvementPercentage: Math.abs(improvementPercentage),
    conversionTimeMs: conversionTime,
    performanceScore,
    maintainabilityIndex: convertedComplexity.maintainabilityIndex,
    // Enhanced metrics
    linesReduced: Math.max(0, linesReduced),
    loopsReduced: Math.max(0, loopsReduced),
    originalLines,
    convertedLines,
    originalLoops,
    convertedLoops,
    codeQuality: {
      totalLines: convertedComplexity.totalLines,
      codeLines: convertedComplexity.codeLines,
      commentRatio: Math.round(convertedComplexity.commentRatio * 100),
      complexityLevel: convertedComplexity.cyclomaticComplexity > 10 ? 'High' : convertedComplexity.cyclomaticComplexity > 5 ? 'Medium' : 'Low' as 'Low' | 'Medium' | 'High'
    },
    recommendations
  };
};

// Generate issues based on quantitative analysis
const generateQuantitativeIssues = (
  originalComplexity: any,
  convertedComplexity: any,
  originalCode: string,
  convertedCode: string
): ConversionIssue[] => {
  const issues: ConversionIssue[] = [];
  
  if (convertedComplexity.cyclomaticComplexity > 15) {
    issues.push({
      id: uuidv4(),
      lineNumber: 1,
      description: `High cyclomatic complexity (${convertedComplexity.cyclomaticComplexity}). Consider refactoring to improve maintainability.`,
      severity: 'warning',
      originalCode: 'Complex procedure',
      suggestedFix: 'Break down into smaller functions'
    });
  }
  
  if (convertedComplexity.maintainabilityIndex < 50) {
    issues.push({
      id: uuidv4(),
      lineNumber: 1,
      description: `Low maintainability index (${convertedComplexity.maintainabilityIndex}/100). Code may be difficult to maintain.`,
      severity: 'warning',
      originalCode: 'Low maintainability',
      suggestedFix: 'Refactor code structure and add documentation'
    });
  }
  
  return issues;
};

export const generateConversionReport = (results: ConversionResult[]): string => {
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  // Calculate performance metrics
  const totalLinesReduced = results.reduce((sum, result) => 
    sum + (result.performance?.linesReduced || 0), 0
  );
  const totalLoopsReduced = results.reduce((sum, result) => 
    sum + (result.performance?.loopsReduced || 0), 0
  );
  const totalConversionTime = results.reduce((sum, result) => 
    sum + (result.performance?.conversionTimeMs || 0), 0
  );
  const averageConversionTime = results.length > 0 ? totalConversionTime / results.length : 0;
  
  const totalOriginalLines = results.reduce((sum, result) => 
    sum + (result.performance?.originalLines || 0), 0
  );
  const totalConvertedLines = results.reduce((sum, result) => 
    sum + (result.performance?.convertedLines || 0), 0
  );
  const totalOriginalLoops = results.reduce((sum, result) => 
    sum + (result.performance?.originalLoops || 0), 0
  );
  const totalConvertedLoops = results.reduce((sum, result) => 
    sum + (result.performance?.convertedLoops || 0), 0
  );
  
  return `
# Code Conversion Report

Generated: ${new Date().toLocaleString()}

## Summary
- Total Files: ${results.length}
- Successful: ${successCount}
- Warnings: ${warningCount}
- Errors: ${errorCount}

## Performance Metrics
- Total Lines Reduced: ${totalLinesReduced}
- Total Loops Reduced: ${totalLoopsReduced}
- Average Conversion Time: ${Math.round(averageConversionTime)}ms
- Total Conversion Time: ${Math.round(totalConversionTime)}ms

### Code Optimization Summary
- Original Lines: ${totalOriginalLines}
- Converted Lines: ${totalConvertedLines}
- Lines Reduction: ${totalOriginalLines > 0 ? Math.round(((totalOriginalLines - totalConvertedLines) / totalOriginalLines) * 100) : 0}%
- Original Loops: ${totalOriginalLoops}
- Converted Loops: ${totalConvertedLoops}
- Loops Reduction: ${totalOriginalLoops > 0 ? Math.round(((totalOriginalLoops - totalConvertedLoops) / totalOriginalLoops) * 100) : 0}%

## File Details
${results.map(result => `
### ${result.originalFile.name}
- Status: ${result.status}
- Data Types Mapped: ${result.dataTypeMapping?.length || 0}
- Issues Found: ${result.issues?.length || 0}
- Lines Reduced: ${result.performance?.linesReduced || 0}
- Loops Reduced: ${result.performance?.loopsReduced || 0}
- Conversion Time: ${result.performance?.conversionTimeMs || 0}ms
- Performance Score: ${result.performance?.performanceScore || 0}/100
`).join('')}

## Recommendations
- Review all converted code for accuracy
- Test in Oracle environment
- Validate data integrity
- Monitor performance
- Consider the ${totalLinesReduced} lines and ${totalLoopsReduced} loops that were optimized
`;
};
