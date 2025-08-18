// Balanced Sybase to Oracle Migration - Right-sized Performance Optimization
// Required Dependencies:
// npm install @langchain/core @langchain/google-genai zod

import type { ConversionResult, CodeFile, ConversionIssue, DataTypeMapping } from '@/types';

// LangChain & Zod imports for structured, reliable AI interaction
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { supabase } from '../integrations/supabase/client';
import { isCacheEnabled } from '@/utils/conversionUtils';

const _API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// console.log('Gemini API KEY:', _API_KEY); // Removed for security

// Check if API key is available
if (!_API_KEY) {
  console.warn('Google Generative AI API key is missing. AI features will be disabled.');
}

// Use a balanced model configuration - only create if API key exists
const model = _API_KEY ? new ChatGoogleGenerativeAI({
    apiKey: _API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0.1, // Lower temperature for more consistent output
}) : null;

// Simplified but effective output schema
const conversionOutputSchema = z.object({
    converted_code: z.string().describe("Clean, syntactically correct Oracle code. Apply optimization ONLY when beneficial. Keep it simple for simple operations."),
    issues: z.array(z.object({
        description: z.string(),
        severity: z.enum(["warning", "error", "critical"]),
        original_code_snippet: z.string(),
        suggested_fix: z.string(),
        optimization_needed: z.boolean().describe("True only if this issue significantly impacts performance"),
        performanceImpact: z.enum(["high", "medium", "low"]),
        category: z.enum(["performance", "scalability", "syntax", "data_type", "best_practice"])
    })),
    explanation: z.string().describe("Brief explanation of key changes made. Focus on essential conversions, not obvious syntax changes."),
    complexity_assessment: z.enum(["simple", "moderate", "complex"]).describe("Assessment of input code complexity"),
    optimization_applied: z.enum(["none", "basic", "advanced"]).describe("Level of optimization applied based on complexity"),
    performance_optimizations: z.array(z.string()),
    oracle_features: z.array(z.string()),
    scalability_score: z.number().min(1).max(10),
    maintainability_score: z.number().min(1).max(10)
});

const parser = StructuredOutputParser.fromZodSchema(conversionOutputSchema);

// Balanced Prompt Template - Right-sized optimization
const promptTemplate = new PromptTemplate({
    template: `You are an experienced Oracle migration specialist. Your goal is to produce CLEAN, MAINTAINABLE Oracle code with APPROPRIATE optimization.

**CRITICAL PRINCIPLE: RIGHT-SIZED OPTIMIZATION**
- Simple operations (few rows, basic DDL/DML) → Keep it simple and clean
- Moderate operations (hundreds of rows, some logic) → Apply basic optimizations  
- Complex operations (thousands+ rows, complex logic) → Apply advanced patterns

**OPTIMIZATION GUIDELINES BY COMPLEXITY:**

**SIMPLE CODE (≤10 lines, basic DDL/DML):**
- Direct syntax conversion only
- Minimal comments (only for non-obvious changes)
- Use simple INSERT statements for small datasets (≤10 rows)
- Focus on correctness, not micro-optimization

**MODERATE CODE (10-50 lines, some business logic):**
- Basic optimizations where clearly beneficial
- Use bulk operations for >20 rows
- Add brief comments for key changes
- Balance readability with performance

**COMPLEX CODE (>50 lines, loops, cursors, large datasets):**
- Apply advanced Oracle features (FORALL, BULK COLLECT)
- Comprehensive optimization
- Detailed comments for complex logic only

**CONVERSION RULES:**
1. **Data Types**: INT→NUMBER(10), DATETIME→TIMESTAMP, DECIMAL→NUMBER, GETDATE()→SYSTIMESTAMP
2. **Keep DDL Simple**: Just convert syntax, don't add unnecessary complexity
3. **DML Optimization**: 
   - ≤10 rows: Simple INSERT statements
   - 10-100 rows: Consider single INSERT with multiple VALUES or UNION ALL
   - >100 rows: Use bulk operations (FORALL, BULK COLLECT)
4. **Comments**: Only add comments that provide VALUE, not obvious syntax explanations

{format_instructions}

**Input Sybase Code:**
` + '```' + `
{sybase_code}
` + '```' + `

Remember: SIMPLE code should produce SIMPLE output. Don't over-engineer basic operations!`,
    inputVariables: ["sybase_code"],
    partialVariables: { format_instructions: parser.getFormatInstructions() },
});

// Helper function to analyze code complexity
const analyzeCodeComplexity = (code: string) => {
    const lines = code.split('\n');
    const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('--')).length;
    const commentLines = lines.filter(line => line.trim().startsWith('--')).length;
    const commentRatio = lines.length > 0 ? Math.round((commentLines / lines.length) * 100) : 0;
    // Simple complexity scoring based on code patterns
    const complexityFactors = {
        loops: (code.match(/\b(LOOP|WHILE|FOR)\b/g) || []).length,
        conditionals: (code.match(/\b(IF|CASE|WHEN)\b/g) || []).length,
        cursors: (code.match(/\bCURSOR\b/g) || []).length,
        exceptions: (code.match(/\b(EXCEPTION|RAISE|CATCH)\b/g) || []).length
    };
    const complexityScore = 
        complexityFactors.loops * 2 + 
        complexityFactors.conditionals * 1.5 + 
        complexityFactors.cursors * 3 + 
        complexityFactors.exceptions * 1.5;
    return {
        totalLines: lines.length,
        codeLines,
        commentRatio,
        complexityScore,
        complexityLevel: complexityScore < 10 ? 'Low' : complexityScore < 30 ? 'Medium' : 'High'
    };
};

// Halstead Volume calculator for SQL code
function calculateHalsteadVolume(code: string) {
  // Tokenize code into operators and operands (very basic for SQL)
  const operators = code.match(/(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|AND|OR|NOT|IN|ON|JOIN|LEFT|RIGHT|INNER|OUTER|=|<|>|\+|\-|\*|\/|,|;)/gi) || [];
  const operands = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
  const uniqueOperators = new Set(operators);
  const uniqueOperands = new Set(operands);
  const n1 = uniqueOperators.size;
  const n2 = uniqueOperands.size;
  const N1 = operators.length;
  const N2 = operands.length;
  const vocabulary = n1 + n2;
  const length = N1 + N2;
  // Halstead Volume = length * log2(vocabulary)
  return vocabulary > 0 ? length * Math.log2(vocabulary) : 0;
}

// --- Local Cache Logic ---
async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getConversionCacheKey(code: string, model: string): Promise<string> {
  const hash = await sha256(model + ':' + code);
  return `conversion-cache-${hash}`;
}

async function getCachedConversion(code: string, model: string) {
  const key = await getConversionCacheKey(code, model);
  const cached = localStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCachedConversion(code: string, model: string, result: any) {
  const key = await getConversionCacheKey(code, model);
  localStorage.setItem(key, JSON.stringify(result));
}

// --- Backend Cache Logic ---
async function setBackendCachedConversion(hash: string, original_code: string, ai_model: string, converted_code: string, metrics: any, issues: any, data_type_mapping: any) {
  await supabase
    .from('conversion_cache')
    .insert([{ content_hash: hash, original_code, converted_code, ai_model, metrics, issues, data_type_mapping }]);
}

async function getBackendCachedConversion(hash: string, ai_model: string) {
  const { data, error } = await supabase
    .from('conversion_cache')
    .select('*')
    .eq('content_hash', hash)
    .eq('ai_model', ai_model)
    .single();
  if (error) {
    console.error('Error fetching from backend cache:', error);
    return null;
  }
  return data;
}

// Enhanced conversion with complexity assessment
const convertSybaseToOracle = async (file: CodeFile): Promise<ConversionResult> => {
    const startTime = Date.now();
    const normalizedContent = file.content.replace(/\r\n/g, '\n').trim();
    const aiModel = "gemini-2.5-flash";
    const hash = await getConversionCacheKey(normalizedContent, aiModel);

    if (isCacheEnabled()) {
      // 1. Check backend (DB) cache
      const backendCached = await getBackendCachedConversion(hash, aiModel);
      if (backendCached && backendCached.converted_code) {
        console.log('[DB CACHE HIT]', file.name);
        let result = JSON.parse(backendCached.converted_code);
        if (result && result.performance) result.performance.conversionTimeMs = 1;
        return result;
      } else {
        console.log('[DB CACHE MISS]', file.name);
      }

      // 2. Check local cache
      const cached = await getCachedConversion(normalizedContent, aiModel);
      if (cached) {
        console.log('[LOCAL CACHE HIT]', file.name);
        if (cached.performance) cached.performance.conversionTimeMs = 1;
        return cached;
      } else {
        console.log('[LOCAL CACHE MISS]', file.name);
      }
    }
    // Check if model is available
    if (!model) {
        return {
            id: crypto.randomUUID(),
            originalFile: file,
            convertedCode: '-- ERROR: Google Generative AI API key is not configured.\n-- Please add VITE_GEMINI_API_KEY to your environment variables.',
            issues: [{
                id: crypto.randomUUID(),
                lineNumber: 1,
                description: 'CRITICAL: Google Generative AI API key is missing.',
                severity: 'critical',
                originalCode: file.content.substring(0, 100),
                suggestedFix: 'Add VITE_GEMINI_API_KEY environment variable with your Google Generative AI API key.',
                performanceImpact: 'high',
                category: 'syntax'
            }],
            dataTypeMapping: [],
            performance: { originalComplexity: 0, convertedComplexity: 0, improvementPercentage: 0, conversionTimeMs: Date.now() - startTime, performanceScore: 0, maintainabilityIndex: 0, codeQuality: { totalLines: 0, codeLines: 0, commentRatio: 0, complexityLevel: 'Low' }, recommendations: [], scalabilityMetrics: { bulkOperationsUsed: false, bulkCollectUsed: false, modernOracleFeaturesCount: 0, scalabilityScore: 1, maintainabilityScore: 1 } },
            status: 'error',
            explanations: ['Conversion failed: Google Generative AI API key is not configured.'],
            scalabilityScore: 1,
            maintainabilityScore: 1,
            performanceOptimizations: [],
            oracleFeatures: []
        };
    }

    const chain = promptTemplate.pipe(model).pipe(parser);
    let aiOutput;
    try {
        aiOutput = await chain.invoke({
            sybase_code: file.content,
        });
    } catch (e) {
        return {
            id: crypto.randomUUID(),
            originalFile: file,
            convertedCode: '-- ERROR: AI failed to generate valid structured output.',
            issues: [{
                id: crypto.randomUUID(),
                lineNumber: 1,
                description: 'CRITICAL: AI model failed to return valid structured output.',
                severity: 'critical',
                originalCode: file.content.substring(0, 100),
                suggestedFix: 'Review input file for syntax errors.',
                performanceImpact: 'high',
                category: 'syntax'
            }],
            dataTypeMapping: [],
            performance: { originalComplexity: 0, convertedComplexity: 0, improvementPercentage: 0, conversionTimeMs: Date.now() - startTime, performanceScore: 0, maintainabilityIndex: 0, codeQuality: { totalLines: 0, codeLines: 0, commentRatio: 0, complexityLevel: 'Low' }, recommendations: [], scalabilityMetrics: { bulkOperationsUsed: false, bulkCollectUsed: false, modernOracleFeaturesCount: 0, scalabilityScore: 1, maintainabilityScore: 1 } },
            status: 'error',
            explanations: ['Conversion failed due to model output parsing error.'],
            scalabilityScore: 1,
            maintainabilityScore: 1,
            performanceOptimizations: [],
            oracleFeatures: []
        };
    }
    const conversionTime = Date.now() - startTime;
    const outputLines = aiOutput.converted_code.split('\n').length;
    const inputLines = file.content.split('\n').length;
    const expansionRatio = outputLines / inputLines;
    const issues: ConversionIssue[] = aiOutput.issues.map(issue => ({
        id: crypto.randomUUID(),
        lineNumber: 1,
        description: `[${issue.category.toUpperCase()}] ${issue.description}`,
        severity: issue.severity,
        originalCode: issue.original_code_snippet,
        suggestedFix: issue.suggested_fix,
        performanceImpact: issue.performanceImpact,
        category: issue.category
    }));
    const originalComplexity = analyzeCodeComplexity(file.content);
    const convertedComplexity = analyzeCodeComplexity(aiOutput.converted_code);
    const performanceMetrics = generateBalancedPerformanceMetrics(
        originalComplexity,
        convertedComplexity,
        conversionTime,
        aiOutput.complexity_assessment,
        aiOutput.optimization_applied,
        expansionRatio,
        aiOutput.converted_code,
        file.content
    );
    const result: ConversionResult = {
        id: crypto.randomUUID(),
        originalFile: file,
        convertedCode: aiOutput.converted_code,
        issues,
        dataTypeMapping: extractDataTypeMappings(file.content),
        performance: performanceMetrics,
        status: issues.some(i => i.severity === 'critical') ? 'error' : issues.length > 0 ? 'warning' : 'success',
        explanations: [
            aiOutput.explanation,
            `Complexity: ${aiOutput.complexity_assessment}, Optimization: ${aiOutput.optimization_applied}`,
            `Code expansion: ${inputLines} → ${outputLines} lines (${expansionRatio.toFixed(1)}x)`
        ],
        scalabilityScore: aiOutput.scalability_score,
        maintainabilityScore: aiOutput.maintainability_score,
        performanceOptimizations: aiOutput.performance_optimizations,
        oracleFeatures: aiOutput.oracle_features
    };
    if (isCacheEnabled()) {
      // Save to local cache
      await setCachedConversion(normalizedContent, aiModel, result);
      // Save to backend cache
      await setBackendCachedConversion(
        hash,
        normalizedContent,
        aiModel,
        JSON.stringify(result), // store as string
        result.performance,
        result.issues,
        result.dataTypeMapping
      );
    }
    return result;
};

// Balanced performance metrics that account for appropriate sizing
const generateBalancedPerformanceMetrics = (
    originalComplexity: any,
    convertedComplexity: any,
    conversionTime: number,
    complexityAssessment: string,
    optimizationLevel: string,
    expansionRatio: number,
    convertedCode: string,
    originalCode: string // <-- add this parameter
) => {
    let performanceScore = 70; // Base score
    const safeConvertedCode = typeof convertedCode === 'string' ? convertedCode : '';
    if (complexityAssessment === 'simple' && expansionRatio > 4) {
        performanceScore -= 20;
    } else if (complexityAssessment === 'simple' && expansionRatio > 2.5) {
        performanceScore -= 10;
    }
    if (complexityAssessment === 'complex' && optimizationLevel === 'advanced') {
        performanceScore += 20;
    } else if (complexityAssessment === 'moderate' && optimizationLevel === 'basic') {
        performanceScore += 10;
    } else if (complexityAssessment === 'simple' && optimizationLevel === 'none') {
        performanceScore += 10;
    }
    const recommendations = generateRecommendations(safeConvertedCode, performanceScore);
    if (expansionRatio > 3 && complexityAssessment === 'simple') {
        recommendations.push('⚠️ Consider simplifying - output is over-engineered for input complexity');
    }
    if (complexityAssessment === 'complex' && optimizationLevel === 'none') {
        recommendations.push('⚡ Complex code could benefit from optimization patterns');
    }
    // --- Category-based metrics ---
    const complexityScore = convertedComplexity.complexityScore || 0;
    let complexityCategory = 'Simple';
    if (complexityScore >= 30) complexityCategory = 'Complex';
    else if (complexityScore >= 10) complexityCategory = 'Moderate';

    let maintainabilityIndex = 0;
    let improvementPercentage = 0;
    if (complexityCategory === 'Simple') {
        maintainabilityIndex = 80;
        improvementPercentage = 0;
    } else {
        // Standard Maintainability Index
        const cyclomatic = convertedComplexity.complexityScore || 1;
        const loc = convertedComplexity.totalLines || 1;
        const halstead = calculateHalsteadVolume(safeConvertedCode);
        if (halstead > 0 && loc > 0) {
            maintainabilityIndex = Math.max(0, (171 - 5.2 * Math.log(halstead) - 0.23 * cyclomatic - 16.2 * Math.log(loc)) * 100 / 171);
            maintainabilityIndex = Math.round(maintainabilityIndex);
        }
        improvementPercentage = Math.round(
            ((originalComplexity.complexityScore - convertedComplexity.complexityScore) /
            (originalComplexity.complexityScore || 1)) * 100
        );
    }
    return {
        originalComplexity: originalComplexity.complexityScore,
        convertedComplexity: convertedComplexity.complexityScore,
        improvementPercentage,
        conversionTimeMs: conversionTime,
        performanceScore: Math.max(0, Math.min(100, performanceScore)),
        maintainabilityIndex,
        complexityCategory,
        codeQuality: {
            totalLines: convertedComplexity.totalLines,
            codeLines: convertedComplexity.codeLines,
            commentRatio: convertedComplexity.commentRatio,
            complexityLevel: convertedComplexity.complexityLevel
        },
        recommendations,
        scalabilityMetrics: {
            bulkOperationsUsed: safeConvertedCode.includes('FORALL'),
            bulkCollectUsed: safeConvertedCode.includes('BULK COLLECT'),
            modernOracleFeaturesCount: countModernFeatures(safeConvertedCode),
            scalabilityScore: calculateScalabilityScore(safeConvertedCode),
            maintainabilityScore: Math.round(convertedComplexity.commentRatio * 10 * 100) / 100
        },
        // Add these fields for dashboard and viewer
        originalLines: originalComplexity.codeLines,
        convertedLines: convertedComplexity.codeLines,
        originalLoops: originalComplexity.complexityScore && originalCode ? (originalCode.match(/\b(LOOP|WHILE|FOR)\b/g) || []).length : 0,
        convertedLoops: convertedComplexity.complexityScore && convertedCode ? (convertedCode.match(/\b(LOOP|WHILE|FOR)\b/g) || []).length : 0
    };
};

// Helper function to extract data type mappings
const extractDataTypeMappings = (code: string): DataTypeMapping[] => {
    const mappings: DataTypeMapping[] = [];
    const sybaseTypes = code.match(/\b(int|varchar|datetime|text|numeric|decimal|char|bit)\b/gi) || [];
    const typeMap: Record<string, { oracle: string; description: string }> = {
        'int': { oracle: 'NUMBER(10)', description: 'Integer numeric type' },
        'varchar': { oracle: 'VARCHAR2', description: 'Variable-length character type' },
        'datetime': { oracle: 'TIMESTAMP', description: 'Date and time type' },
        'text': { oracle: 'CLOB', description: 'Character large object type' },
        'numeric': { oracle: 'NUMBER', description: 'Exact numeric type' },
        'decimal': { oracle: 'NUMBER', description: 'Decimal numeric type' },
        'char': { oracle: 'CHAR', description: 'Fixed-length character type' },
        'bit': { oracle: 'NUMBER(1)', description: 'Boolean type' }
    };
    const uniqueTypes = [...new Set(sybaseTypes.map(t => t.toLowerCase()))];
    uniqueTypes.forEach(type => {
        const mapping = typeMap[type];
        if (mapping) {
            mappings.push({
                sybaseType: type,
                oracleType: mapping.oracle,
                description: mapping.description
            });
        }
    });
    return mappings;
};

// Helper function to generate recommendations
const generateRecommendations = (code: string, performanceScore: number): string[] => {
    const recommendations: string[] = [];
    if (!code || typeof code !== 'string') return recommendations;
    if (!code.includes('FORALL') && code.includes('INSERT')) {
        recommendations.push('Consider using FORALL for bulk DML operations');
    }
    if (!code.includes('BULK COLLECT') && code.includes('CURSOR')) {
        recommendations.push('Use BULK COLLECT for efficient data retrieval');
    }
    if (code.includes('EXECUTE IMMEDIATE')) {
        recommendations.push('Minimize dynamic SQL usage to reduce parsing overhead');
    }
    if (!code.includes('/*+')) {
        recommendations.push('Consider using optimizer hints for complex queries');
    }
    if (performanceScore < 70) {
        recommendations.push('Review overall performance optimizations');
    }
    return recommendations;
};

// Helper function to count modern Oracle features
const countModernFeatures = (code: string): number => {
    const features = [
        'BULK COLLECT',
        'FORALL',
        'MERGE',
        'WITH',
        'PARALLEL',
        'PARTITION',
        'RESULT_CACHE',
        'MULTISET',
        'CROSS APPLY',
        'PIVOT'
    ];
    return features.reduce((count, feature) => 
        count + (code.includes(feature) ? 1 : 0), 0);
};

// Helper function to calculate scalability score
const calculateScalabilityScore = (code: string): number => {
    let score = 5; // Base score
    if (code.includes('BULK COLLECT')) score += 1;
    if (code.includes('FORALL')) score += 1;
    if (code.includes('PARALLEL')) score += 1;
    if (code.includes('PARTITION')) score += 1;
    if (code.includes('LIMIT') && code.includes('BULK COLLECT')) score += 0.5;
    if (code.includes('/*+')) score += 0.5;
    if (code.includes('RESULT_CACHE')) score += 0.5;
    if (!code.includes('EXECUTE IMMEDIATE')) score += 0.5;
    return Math.min(10, score);
};

// Enhanced reporting with appropriateness metrics
const generateBalancedConversionReport = (results: ConversionResult[]): string => {
    const successCount = results.filter(r => r.status === 'success').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const avgExpansion = results.reduce((sum, r) => sum + (r.performance?.codeQuality?.totalLines || 0) / 
        (r.originalFile.content.split('\n').length || 1), 0) / results.length;
    const overEngineeredFiles = results.filter(r => 
        r.performance?.codeQuality?.totalLines > r.originalFile.content.split('\n').length * 3
    ).length;
    const complexityBreakdown = results.reduce((acc, r) => {
        const level = r.performance?.codeQuality?.complexityLevel || 'unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return `
# Balanced Oracle Migration Report
Generated: ${new Date().toLocaleString()}

## Conversion Summary
- Total Files: ${results.length}
- ✅ Successful: ${successCount}
- ⚠️  With Warnings: ${warningCount}  
- ❌ With Errors: ${errorCount}

## Code Quality Metrics
- 📏 Average Code Expansion: ${avgExpansion.toFixed(1)}x
- ⚠️  Over-engineered Files: ${overEngineeredFiles} (files with >3x expansion)

## Complexity Assessment
${Object.entries(complexityBreakdown)
    .map(([complexity, count]) => `- ${complexity.charAt(0).toUpperCase() + complexity.slice(1)}: ${count} files`)
    .join('\n')}

## Quality Recommendations
${overEngineeredFiles > 0 ? `- 🚨 Review ${overEngineeredFiles} over-engineered files for simplification` : '- ✅ No over-engineering detected'}
- 🔍 Focus testing on ${results.filter(r => r.performance?.codeQuality?.complexityLevel === 'High').length} complex conversions
- 📊 Monitor performance of files with bulk operations: ${results.filter(r => r.performance?.scalabilityMetrics?.bulkOperationsUsed).length}

## Storage Impact
- Total converted lines: ${results.reduce((sum, r) => sum + (r.performance?.codeQuality?.totalLines || 0), 0).toLocaleString()}
- Original lines: ${results.reduce((sum, r) => sum + r.originalFile.content.split('\n').length, 0).toLocaleString()}
- Storage increase: ${((avgExpansion - 1) * 100).toFixed(1)}%
`;
};

export {
  analyzeCodeComplexity,
  convertSybaseToOracle,
  generateBalancedConversionReport,
  generateBalancedPerformanceMetrics
}; 