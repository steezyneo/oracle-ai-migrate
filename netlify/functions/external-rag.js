const { Pinecone } = require('@pinecone-database/pinecone');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
      },
      body: ''
    };
  }

  // Add a simple GET endpoint for testing
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'RAG API is running!',
        hasPineconeKey: !!process.env.PINECONE_API_KEY,
        timestamp: new Date().toISOString()
      })
    };
  }

  try {
    const { query } = JSON.parse(event.body);
    
    if (!query) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Query is required' })
      };
    }

    // Initialize Pinecone
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ PINECONE_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'PINECONE_API_KEY environment variable is not configured',
          details: 'Please set PINECONE_API_KEY in your Netlify environment variables'
        })
      };
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    // Get the index
    const indexName = 'oracle-migration-docs';
    let index;
    
    try {
      index = pinecone.index(indexName);
    } catch (error) {
      console.error('Index not found:', error.message);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'RAG index not found. Please run the upload script first.',
          details: error.message 
        })
      };
    }

    // Extract key terms from the query for better matching
    const keyTerms = extractKeyTerms(query);
    
    // Create a combined query with key terms for better context retrieval
    const enhancedQuery = `${query} ${keyTerms.join(' ')}`;
    console.log(`Enhanced query: ${enhancedQuery}`);
    
    // Try multiple search strategies and combine results
    let allResults = [];
    let bestScore = 0;
    
    // Strategy 1: Original query with higher weight
    try {
      const originalQueryEmbedding = generateSimpleEmbedding(query);
      const originalResults = await index.query({
        vector: originalQueryEmbedding,
        topK: 15,  // Increased from 10
        includeMetadata: true
      });
      
      if (originalResults.matches.length > 0) {
        // Add results with source tracking
        allResults.push(...originalResults.matches.map(match => ({
          ...match,
          source: 'original_query',
          weight: 1.0  // Full weight for original query
        })));
      }
    } catch (error) {
      console.error('Original query search failed:', error.message);
    }
    
    // Strategy 2: Enhanced query
    try {
      const enhancedQueryEmbedding = generateSimpleEmbedding(enhancedQuery);
      const enhancedResults = await index.query({
        vector: enhancedQueryEmbedding,
        topK: 10,
        includeMetadata: true
      });
      
      if (enhancedResults.matches.length > 0) {
        // Add results with source tracking
        allResults.push(...enhancedResults.matches.map(match => ({
          ...match,
          source: 'enhanced_query',
          weight: 0.9  // Slightly lower weight
        })));
      }
    } catch (error) {
      console.error('Enhanced query search failed:', error.message);
    }
    
    // Strategy 3: Key terms search for broader context
    for (const term of keyTerms.slice(0, 3)) {  // Limit to top 3 terms
      try {
        const termEmbedding = generateSimpleEmbedding(term);
        const termResults = await index.query({
          vector: termEmbedding,
          topK: 5,
          includeMetadata: true
        });
        
        if (termResults.matches.length > 0) {
          // Add results with source tracking and lower weight
          allResults.push(...termResults.matches.map(match => ({
            ...match,
            source: `term_${term}`,
            weight: 0.7  // Lower weight for individual terms
          })));
        }
      } catch (error) {
        console.error(`Term search failed for "${term}":`, error.message);
      }
    }

    // Process and deduplicate results
    const seenIds = new Set();
    const uniqueResults = [];
    
    // Sort by weighted score (score * weight)
    allResults.sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
    
    // Keep only unique results with highest scores
    for (const match of allResults) {
      const contentId = match.metadata?.id || match.id;
      if (!seenIds.has(contentId)) {
        seenIds.add(contentId);
        uniqueResults.push(match);
      }
    }
    
    // Limit to top results
    const topResults = uniqueResults.slice(0, 15);
    
    // Extract context from results
    let context = '';
    if (topResults.length > 0) {
      // Group by category if available
      const categoryGroups = {};
      
      topResults.forEach(match => {
        const category = match.metadata?.category || 'general';
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        const content = match.metadata?.text || match.metadata?.content || '';
        if (content.length > 0) {
          categoryGroups[category].push(content);
        }
      });
      
      // Build context with category headers
      const contextParts = [];
      for (const [category, contents] of Object.entries(categoryGroups)) {
        if (contents.length > 0) {
          const categoryHeader = `CATEGORY: ${category.toUpperCase()}`;
          const categoryContent = contents.join('\n\n');
          contextParts.push(`${categoryHeader}\n${categoryContent}`);
        }
      }
      
      context = contextParts.join('\n\n');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        context,
        matches: topResults?.length || 0,
        query: query,
        enhancedQuery: enhancedQuery,
        keyTerms: keyTerms,
        categories: Object.keys(topResults.reduce((acc, match) => {
          const category = match.metadata?.category || 'general';
          acc[category] = true;
          return acc;
        }, {})),
        debug: {
          totalMatches: allResults.length,
          uniqueMatches: uniqueResults.length,
          topMatches: topResults.length,
          contextLength: context.length,
          hasResults: (topResults?.length || 0) > 0,
          searchStrategies: {
            originalQuery: allResults.filter(m => m.source === 'original_query').length,
            enhancedQuery: allResults.filter(m => m.source === 'enhanced_query').length,
            keyTerms: allResults.filter(m => m.source.startsWith('term_')).length
          }
        }
      })
    };

  } catch (error) {
    console.error('RAG API error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

// Extract key terms from query for better search
function extractKeyTerms(query) {
  // Normalize the query
  const normalizedQuery = query.toLowerCase()
    .replace(/[\?\!\,\.\;\:\(\)\[\]\{\}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Expanded stop words list
  const stopWords = new Set([
    'how', 'do', 'i', 'you', 'your', 'me', 'my', 'mine', 'we', 'our', 'ours', 'they', 'their', 'theirs',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'what', 'who', 'whom', 'which',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
    'have', 'has', 'had', 'having',
    'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'should',
    'if', 'then', 'else', 'so', 'such', 'both', 'each', 'few', 'more', 'most', 'some',
    'any', 'all', 'no', 'not', 'only', 'own', 'same', 'too', 'very',
    'just', 'about', 'above', 'below', 'between', 'into', 'through', 'during', 'before', 'after',
    'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'once',
    'get', 'getting', 'got', 'make', 'making', 'made', 'use', 'using', 'used',
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'first', 'second', 'third', 'fourth', 'fifth', 'last',
    'need', 'needs', 'needed', 'want', 'wants', 'wanted', 'like', 'likes', 'liked'
  ]);
  
  // Extract words
  const words = normalizedQuery.split(/\s+/);
  
  // Extract phrases (2-3 word combinations)
  const phrases = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopWords.has(words[i]) && !stopWords.has(words[i+1])) {
      phrases.push(`${words[i]} ${words[i+1]}`);
    }
    
    if (i < words.length - 2 && !stopWords.has(words[i]) && 
        !stopWords.has(words[i+2])) {
      phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
    }
  }
  
  // Filter individual words
  const keyTerms = words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.replace(/[^\w]/g, ''))
    .filter(word => word.length > 0);
  
  // Add common variations for single words
  const variations = [];
  keyTerms.forEach(term => {
    variations.push(term);
    if (term.endsWith('ing')) {
      variations.push(term.slice(0, -3)); // remove 'ing'
    }
    if (term.endsWith('ed')) {
      variations.push(term.slice(0, -2)); // remove 'ed'
    }
    if (term.endsWith('s')) {
      variations.push(term.slice(0, -1)); // remove 's'
    }
    if (term.endsWith('es')) {
      variations.push(term.slice(0, -2)); // remove 'es'
    }
    if (term.endsWith('ies')) {
      variations.push(term.slice(0, -3) + 'y'); // plurals like 'queries' -> 'query'
    }
  });
  
  // Combine phrases and word variations, removing duplicates
  return [...new Set([...phrases, ...variations])]; 
}

// Simple text similarity function (no external API needed)
function generateSimpleEmbedding(text) {
  // Create a simple hash-based embedding (384 dimensions like Hugging Face)
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  words.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const position = Math.abs(hash) % 384;
    embedding[position] += 1;
  });
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    embedding.forEach((val, i) => {
      embedding[i] = val / magnitude;
    });
  }
  
  return embedding;
}