import { ConversionResult, CodeFile, ConversionIssue, DataTypeMapping } from '@/types';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyAiU5Dt6ZEEYsYCh4Z02GNm1XWXup6xcBg";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Cache for similar conversions to speed up the process
const conversionCache = new Map<string, string>();

// Generate a cache key based on file content and type
const generateCacheKey = (content: string, type: string): string => {
  // Use a simple hash of content + type for caching
  const hash = btoa(content.substring(0, 100) + type).substring(0, 16);
  return hash;
};

// Enhanced AI-based code conversion with performance optimizations
export const convertSybaseToOracle = async (file: CodeFile, aiModel: string = 'default'): Promise<ConversionResult> => {
  console.log(`Converting ${file.name} with ${aiModel} AI model`);
  
  const startTime = Date.now();
  
  // Check cache first for faster conversion
  const cacheKey = generateCacheKey(file.content, file.type);
  let convertedCode = conversionCache.get(cacheKey);
  
  if (!convertedCode) {
    // Extract data type mappings from original code
    const dataTypeMapping = extractDataTypeMappings(file.content);
    
    // Use optimized prompt for faster processing
    const prompt = `Convert this Sybase SQL to Oracle PL/SQL efficiently. Output only the converted code:\n\n${file.content}`;
    
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", // Using flash model for faster processing
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.1, // Lower temperature for more consistent, faster results
        }
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      convertedCode = response.text().replace(/^```[a-zA-Z]*|```$/g, '').trim();
      
      // Cache the result for future use
      conversionCache.set(cacheKey, convertedCode);
    } catch (error) {
      console.error('Conversion failed:', error);
      throw new Error(`Conversion failed: ${error}`);
    }
  } else {
    console.log(`Using cached conversion for ${file.name}`);
  }

  const conversionTime = Date.now() - startTime;
  
  // Analyze code complexity (simplified for speed)
  const originalComplexity = analyzeCodeComplexityFast(file.content);
  const convertedComplexity = analyzeCodeComplexityFast(convertedCode);
  
  // Generate lightweight performance metrics
  const performanceMetrics = generateFastPerformanceMetrics(
    originalComplexity,
    convertedComplexity,
    conversionTime,
    file.content,
    convertedCode
  );

  // Generate basic issues analysis
  const issues: ConversionIssue[] = generateBasicIssues(file.content, convertedCode);

  return {
    id: crypto.randomUUID(),
    originalFile: file,
    convertedCode,
    issues,
    dataTypeMapping: extractDataTypeMappings(file.content),
    performance: performanceMetrics,
    status: issues.some(i => i.severity === 'error') ? 'error' : 
            issues.length > 0 ? 'warning' : 'success'
  };
};

// Batch conversion for multiple files with parallel processing
export const convertMultipleFiles = async (
  files: CodeFile[], 
  aiModel: string = 'default',
  onProgress?: (completed: number, total: number) => void
): Promise<ConversionResult[]> => {
  const BATCH_SIZE = 3; // Process 3 files at a time to avoid rate limits
  const results: ConversionResult[] = [];
  
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchPromises = batch.map(file => convertSybaseToOracle(file, aiModel));
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Handle results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to convert ${batch[index].name}:`, result.reason);
        // Create a failed result
        results.push({
          id: crypto.randomUUID(),
          originalFile: batch[index],
          convertedCode: '',
          issues: [{
            id: crypto.randomUUID(),
            description: `Conversion failed: ${result.reason}`,
            severity: 'error',
            originalCode: batch[index].content,
            suggestedFix: 'Try converting this file individually'
          }],
          dataTypeMapping: [],
          performance: {} as any,
          status: 'error'
        });
      }
    });
    
    // Update progress
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, files.length), files.length);
    }
    
    // Small delay between batches to be respectful to API limits
    if (i + BATCH_SIZE < files.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};

// Fast complexity analysis
const analyzeCodeComplexityFast = (code: string) => {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('--')).length;
  const controlStructures = (code.match(/\b(if|while|for|case|when|loop)\b/gi) || []).length;
  
  return {
    totalLines,
    codeLines,
    controlStructures,
    cyclomaticComplexity: controlStructures + 1,
    maintainabilityIndex: Math.max(0, Math.min(100, 100 - (controlStructures * 2)))
  };
};

// Fast performance metrics generation
const generateFastPerformanceMetrics = (
  originalComplexity: any,
  convertedComplexity: any,
  conversionTime: number,
  originalCode: string,
  convertedCode: string
) => {
  return {
    originalComplexity: originalComplexity.cyclomaticComplexity,
    convertedComplexity: convertedComplexity.cyclomaticComplexity,
    conversionTimeMs: conversionTime,
    performanceScore: Math.round(convertedComplexity.maintainabilityIndex),
    maintainabilityIndex: convertedComplexity.maintainabilityIndex,
    codeQuality: {
      totalLines: convertedComplexity.totalLines,
      codeLines: convertedComplexity.codeLines,
      commentRatio: 10, // Default value for speed
      complexityLevel: convertedComplexity.cyclomaticComplexity > 10 ? 'High' : 
                      convertedComplexity.cyclomaticComplexity > 5 ? 'Medium' : 'Low' as 'Low' | 'Medium' | 'High'
    },
    recommendations: convertedComplexity.cyclomaticComplexity > 10 ? 
      ['Consider breaking down complex procedures'] : []
  };
};

// Basic issues generation
const generateBasicIssues = (originalCode: string, convertedCode: string): ConversionIssue[] => {
  const issues: ConversionIssue[] = [];
  
  // Simple checks for common issues
  if (convertedCode.length < originalCode.length * 0.5) {
    issues.push({
      id: crypto.randomUUID(),
      lineNumber: 1,
      description: 'Converted code seems significantly shorter than original. Please verify completeness.',
      severity: 'warning',
      originalCode: 'Code length check',
      suggestedFix: 'Review the converted code for missing elements'
    });
  }
  
  return issues;
};

const extractDataTypeMappings = (code: string): DataTypeMapping[] => {
  const mappings: DataTypeMapping[] = [];
  const sybaseTypes = [
    { pattern: /\bint\b/gi, oracle: 'NUMBER(10)', desc: 'Integer type' },
    { pattern: /\bvarchar\s*\(\s*(\d+)\s*\)/gi, oracle: 'VARCHAR2($1)', desc: 'Variable-length character string' },
    { pattern: /\bdatetime\b/gi, oracle: 'TIMESTAMP', desc: 'Date and time' },
    { pattern: /\btext\b/gi, oracle: 'CLOB', desc: 'Large text data' }
  ];

  const foundTypes = new Set<string>();
  
  sybaseTypes.forEach(({ pattern, oracle, desc }) => {
    const matches = code.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const sybaseType = match.toLowerCase();
        if (!foundTypes.has(sybaseType)) {
          foundTypes.add(sybaseType);
          mappings.push({
            sybaseType: match,
            oracleType: oracle.replace(/\$(\d+)/g, (_, index) => {
              const params = match.match(/\(([^)]+)\)/);
              if (params) {
                const parts = params[1].split(',').map(p => p.trim());
                return parts[parseInt(index) - 1] || '255';
              }
              return '255';
            }),
            description: desc
          });
        }
      });
    }
  });

  return mappings;
};

export const generateConversionReport = (results: ConversionResult[]): string => {
  const successCount = results.filter(r => r.status === 'success').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  
  return `
# Code Conversion Report

Generated: ${new Date().toLocaleString()}

## Summary
- Total Files: ${results.length}
- Successful: ${successCount}
- Warnings: ${warningCount}
- Errors: ${errorCount}

## File Details
${results.map(result => `
### ${result.originalFile.name}
- Status: ${result.status}
- Conversion Time: ${result.performance?.conversionTimeMs || 0}ms
- Issues Found: ${result.issues?.length || 0}
`).join('')}
`;
};
