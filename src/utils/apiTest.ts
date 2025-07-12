// Simple API test utility
export const testGeminiAPI = async () => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBbhyMmUtGdJhDDUHh7ecI1qsYjR9WQSXU";
  
  console.log('=== GEMINI API TEST ===');
  console.log('API Key present:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY?.length || 0);
  console.log('API Key preview:', GEMINI_API_KEY?.substring(0, 10) + '...');
  
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
    console.error('❌ Invalid API key');
    return { success: false, error: 'Invalid API key' };
  }
  
  try {
    // Test with a simple prompt
    const testPrompt = 'Say "Hello World"';
    console.log('Testing with prompt:', testPrompt);
    
    // This is a basic test - in a real app you'd use the GoogleGenerativeAI library
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const data = await response.json();
    console.log('✅ API test successful:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}; 