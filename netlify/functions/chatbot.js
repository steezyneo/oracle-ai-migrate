const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Hybrid Knowledge System
const FAQ_DATA = {
  "admin panel": {
    answer: "The admin panel provides comprehensive management capabilities for the Oracle migration tool. It includes user management, migration monitoring, performance analytics, and system configuration. Administrators can view all user activities, manage migration projects, and access detailed reports. The panel features a dashboard with real-time metrics, user activity logs, and system health monitoring.",
    category: "administration"
  },
  "history page": {
    answer: "The history page tracks migration history, conversion results, and user activities. It shows completed migrations, conversion statistics, and detailed reports. Users can review past migrations, download conversion results, and analyze performance metrics. The page includes filtering options and export capabilities for comprehensive migration tracking.",
    category: "tracking"
  },
  "dev review": {
    answer: "The dev review tab allows developers to review and approve migration changes. It shows pending conversions that need review, code quality metrics, and suggested improvements. Developers can approve, reject, or request changes to converted code. The review process ensures code quality and maintains standards across the migration project.",
    category: "development"
  },
  "code quality metrics": {
    answer: "Code quality metrics include cyclomatic complexity, lines of code (LOC), comment ratio, maintainability index, performance score, modern features usage, bulk operations, scalability indicators, and overall performance score. These metrics help evaluate the quality of converted Oracle code and ensure it meets high standards.",
    category: "quality"
  },
  "migration process": {
    answer: "The migration process involves uploading Sybase code, converting it to Oracle syntax, analyzing code quality, and generating reports. The system supports stored procedures, functions, triggers, and data type conversions. Users can review conversions, download results, and track migration progress through the dashboard.",
    category: "process"
  },
  "conversion process": {
    answer: "The conversion process automatically transforms Sybase code to Oracle-compatible syntax. It handles data type mappings, function conversions, and syntax adjustments. The system provides real-time conversion status, quality metrics, and detailed reports. Users can review and approve conversions before deployment.",
    category: "process"
  },
  "help panel": {
    answer: "The Help Panel provides context-sensitive help throughout the application. It includes FAQs, contact forms, resources, and shortcuts. Users can access step-by-step guides, video tutorials, knowledge base articles, and best practice guides. The panel also offers in-app chat support, email support, and community forum access for comprehensive assistance with migration projects.",
    category: "support"
  }
};

const DOC_LINKS = {
  "admin": "/docs/admin-panel.md",
  "history": "/docs/history-page.md",
  "migration": "/docs/migration-process.md",
  "quality": "/docs/code-quality.md",
  "conversion": "/docs/conversion-guide.md",
  "support": "/docs/user-guide/README.md"
};

const SYSTEM_PROMPT = `You are an AI assistant for a Sybase to Oracle migration project.

RESPONSE GUIDELINES:
- For project-specific questions: Use the provided project documentation to give detailed, accurate answers
- For general migration questions: Use your general knowledge about Sybase to Oracle migration
- For code analysis: Analyze provided code and explain it thoroughly, suggesting improvements
- Be comprehensive and helpful - don't restrict yourself unnecessarily
- If project docs don't contain relevant information, use your general knowledge
- Focus on practical, actionable advice for Oracle migration projects
- You can answer questions about Sybase, Oracle, migration strategies, best practices, and technical details`;

// RAG Integration Function
async function getRAGContext(query) {
  try {
    // Call the external-rag function
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const ragUrl = `${baseUrl}/.netlify/functions/external-rag`;
    
    console.log('🔍 Calling RAG API at:', ragUrl);
    console.log('🔍 Query:', query);
    
    const ragResponse = await fetch(ragUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!ragResponse.ok) {
      console.log('❌ RAG API error:', ragResponse.status);
      return null;
    }

    const ragData = await ragResponse.json();
    console.log('✅ RAG API response:', {
      contextLength: ragData.context?.length || 0,
      matches: ragData.matches || 0,
      hasContext: !!ragData.context
    });
    
    return {
      context: ragData.context,
      matches: ragData.matches,
      debug: ragData.debug
    };
  } catch (error) {
    console.log('❌ RAG API exception:', error.message);
    return null;
  }
}

// Enhanced system prompt with RAG context
function buildEnhancedPrompt(basePrompt, ragContext) {
  if (!ragContext || !ragContext.context) {
    return basePrompt;
  }

  return `${basePrompt}

RELEVANT PROJECT DOCUMENTATION:
${ragContext.context}

INSTRUCTIONS:
- Use the above documentation to provide accurate and helpful answers
- If the documentation contains relevant information, provide detailed responses
- If the documentation has related information, provide what you can and suggest additional resources
- Be helpful and provide actionable advice based on the available documentation
- Only say you don't have information if the documentation truly doesn't contain any relevant content`;
}

async function callOpenRouterAPI(messages, model = 'qwen/qwen3-coder:free') {
  const body = {
    model: model,
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`OpenRouter API rate limited (429). Please try again in a few minutes or upgrade your plan.`);
      }
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
  } catch (error) {
    throw error;
  }
}

async function callGeminiAPI(messages) {
  // Build the full conversation context
  const systemMessage = messages.find(m => m.role === 'system')?.content || SYSTEM_PROMPT;
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  const body = {
    contents: [{
      parts: [{
        text: systemMessage + '\n\n' + conversationMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      }]
    }]
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
  } catch (error) {
    throw error;
  }
}

function extractIntent(userMessage) {
  // Simple intent extraction without hardcoded knowledge
  return 'general_question';
}

function generateSuggestions(intent) {
  // Return generic suggestions that don't contain specific knowledge
  return [
    "Can you help me with this?",
    "What should I know about this?",
    "Tell me more about this topic"
  ];
}

// Hybrid Knowledge Function
function getHybridResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // First, try exact matches
  for (const [key, data] of Object.entries(FAQ_DATA)) {
    if (message.includes(key.toLowerCase())) {
      const category = data.category;
      const docLink = DOC_LINKS[category];
      
      return {
        type: 'faq',
        answer: data.answer,
        docLink: docLink ? `For more details, check: ${docLink}` : null,
        confidence: 'high'
      };
    }
  }
  
  // Then, try word-based matching for more specific queries
  for (const [key, data] of Object.entries(FAQ_DATA)) {
    const keyWords = key.toLowerCase().split(' ');
    const messageWords = message.split(' ');
    
    // Check if all key words are present in the message
    const allKeyWordsPresent = keyWords.every(keyWord => 
      messageWords.some(msgWord => msgWord.includes(keyWord) || keyWord.includes(msgWord))
    );
    
    if (allKeyWordsPresent) {
      const category = data.category;
      const docLink = DOC_LINKS[category];
      
      return {
        type: 'faq',
        answer: data.answer,
        docLink: docLink ? `For more details, check: ${docLink}` : null,
        confidence: 'medium'
      };
    }
  }
  
  // Additional flexible matching for common variations
  const flexibleMatches = {
    'code quality': 'code quality metrics',
    'quality metrics': 'code quality metrics',
    'metrics': 'code quality metrics',
    'admin': 'admin panel',
    'history': 'history page',
    'dev review': 'dev review',
    'development review': 'dev review',
    'migration': 'migration process',
    'conversion': 'conversion process',
    'help': 'help panel',
    'help panel': 'help panel',
    'help tab': 'help panel',
    'help menu': 'help panel'
  };
  
  for (const [flexibleKey, faqKey] of Object.entries(flexibleMatches)) {
    if (message.includes(flexibleKey)) {
      const data = FAQ_DATA[faqKey];
      if (data) {
        const category = data.category;
        const docLink = DOC_LINKS[category];
        
        return {
          type: 'faq',
          answer: data.answer,
          docLink: docLink ? `For more details, check: ${docLink}` : null,
          confidence: 'flexible'
        };
      }
    }
  }
  
  // Check for documentation requests
  if (message.includes('documentation') || message.includes('docs') || message.includes('guide')) {
    return {
      type: 'docs',
      answer: "Here are the available documentation links:\n" + 
              Object.entries(DOC_LINKS).map(([key, link]) => `- ${key}: ${link}`).join('\n'),
      confidence: 'medium'
    };
  }
  
  return null; // Let AI handle it
}

exports.handler = async function(event, context) {
  // Add CORS headers for browser requests
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Add a simple GET endpoint for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Chatbot function is running!',
        status: 'ok',
        timestamp: new Date().toISOString(),
        hasOpenRouterKey: !!OPENROUTER_API_KEY,
        hasGeminiKey: !!GEMINI_API_KEY
      })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  // Check if API keys are configured
  if (!OPENROUTER_API_KEY && !GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'API keys not configured. Please set OPENROUTER_API_KEY or VITE_GEMINI_API_KEY environment variables in Netlify.' 
      })
    };
  }

  try {
    const { message, conversationHistory = [], model = 'gemini' } = JSON.parse(event.body);
     
    if (!message) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Missing message' }) 
      };
    }

    // Extract intent from user message
    const intent = extractIntent(message);
    
    // Hybrid Knowledge System: Check FAQ and docs first
    const hybridResponse = getHybridResponse(message);
    
    // For migration-related questions, prioritize RAG over hardcoded responses
    const migrationKeywords = ['conversion', 'migration', 'sybase', 'oracle', 'process', 'work', 'how'];
    const isMigrationQuestion = migrationKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    // Only use hardcoded FAQ for very specific tool features, not general migration topics
    const toolSpecificKeywords = ['admin panel', 'history page', 'dev review', 'code quality metrics'];
    const isToolSpecificQuestion = toolSpecificKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (hybridResponse && isToolSpecificQuestion && !isMigrationQuestion) {
      
      let finalAnswer = hybridResponse.answer;
      if (hybridResponse.docLink) {
        finalAnswer += '\n\n' + hybridResponse.docLink;
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: finalAnswer,
          intent: intent,
          suggestions: generateSuggestions(intent),
          timestamp: new Date().toISOString(),
          source: 'hardcoded_faq'
        })
      };
    }
    
    // Get RAG context
    const ragContext = await getRAGContext(message);
    
    // Determine if we should use general knowledge
    const hasProjectContext = ragContext && ragContext.context && ragContext.context.length > 0;
    
    // Check for general knowledge questions (what is, define, explain basic concepts)
    const generalKnowledgePatterns = [
      /what is (sybase|oracle)/i,
      /define (sybase|oracle)/i,
      /explain (sybase|oracle)/i,
      /tell me about (sybase|oracle)/i
    ];
    
    const isGeneralKnowledgeQuestion = generalKnowledgePatterns.some(pattern => 
      pattern.test(message)
    );
    
    // Check for migration-specific questions
    const migrationSpecificPatterns = [
      /how to convert/i,
      /migration process/i,
      /conversion process/i,
      /data type mapping/i,
      /function conversion/i,
      /syntax differences/i
    ];
    
    const isMigrationSpecificQuestion = migrationSpecificPatterns.some(pattern => 
      pattern.test(message)
    );
    
    // Prepare conversation history for API
    const baseSystemPrompt = SYSTEM_PROMPT;
    let enhancedSystemPrompt;
    
    if (hasProjectContext && isMigrationSpecificQuestion) {
      // Use project documentation for specific migration questions
      enhancedSystemPrompt = buildEnhancedPrompt(baseSystemPrompt, ragContext);
    } else if (isGeneralKnowledgeQuestion) {
      // Use general knowledge for basic concept questions
      enhancedSystemPrompt = `${baseSystemPrompt}

INSTRUCTIONS:
- This is a general knowledge question about basic concepts
- Use your general knowledge to provide comprehensive, informative answers
- Be helpful and don't restrict yourself unnecessarily
- Provide detailed explanations about Sybase, Oracle, and database concepts`;
    } else if (hasProjectContext) {
      // Use project documentation if available
      enhancedSystemPrompt = buildEnhancedPrompt(baseSystemPrompt, ragContext);
    } else {
      // Use general knowledge for other questions
      enhancedSystemPrompt = `${baseSystemPrompt}

INSTRUCTIONS:
- Use your general knowledge to provide helpful answers
- Be comprehensive and don't restrict yourself unnecessarily
- Focus on being helpful and informative`;
    }
    
    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call appropriate API based on model preference
    let response;
    try {
      if (GEMINI_API_KEY) {
        // Use Gemini as primary choice
        response = await callGeminiAPI(messages);
      } else if (OPENROUTER_API_KEY) {
        // Fallback to OpenRouter if Gemini key not available
        response = await callOpenRouterAPI(messages);
      } else {
        throw new Error('No API keys available');
      }
    } catch (error) {
      // If Gemini fails, try OpenRouter as fallback
      if (OPENROUTER_API_KEY && error.message.includes('Gemini API error')) {
        response = await callOpenRouterAPI(messages);
      } else {
        throw error;
      }
    }

    // Generate contextual suggestions
    const suggestions = generateSuggestions(intent);

    // Prepare docsContext for UI display
    let docsContext = null;
    let source = 'ai_with_general_knowledge';
    
    if (ragContext && ragContext.context && ragContext.context.length > 0) {
      // Parse the context into a structured format for the UI
      docsContext = [{
        file: 'Project Documentation',
        description: 'Relevant documentation retrieved from RAG system',
        sections: [{
          section: 'Retrieved Context',
          content: ragContext.context.substring(0, 500) + (ragContext.context.length > 500 ? '...' : ''),
          lineNumber: 1
        }]
      }];
      source = 'ai_with_rag';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: response,
        intent: intent,
        suggestions: suggestions,
        timestamp: new Date().toISOString(),
        docsContext: docsContext,
        source: source
      })
    };

  } catch (error) {
    console.error('Chatbot error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process message',
        details: error.message
      })
    };
  }
}; 