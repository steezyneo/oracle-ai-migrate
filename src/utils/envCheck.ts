// Environment variable checker for debugging
export const checkEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const optionalVars = [
    'VITE_GEMINI_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  const present = requiredVars.filter(varName => import.meta.env[varName]);
  const optionalPresent = optionalVars.filter(varName => import.meta.env[varName]);

  console.group('🔧 Environment Variables Check');
  console.log('✅ Present (Required):', present);
  console.log('⚠️  Missing (Required):', missing);
  console.log('ℹ️  Present (Optional):', optionalPresent);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please set these in your Netlify environment variables:');
    missing.forEach(varName => {
      console.error(`   ${varName}`);
    });
  } else {
    console.log('✅ All required environment variables are set');
  }
  console.groupEnd();

  return {
    missing,
    present,
    optionalPresent,
    allRequired: missing.length === 0
  };
};

// Call this function early in the app lifecycle
export const initializeEnvironmentCheck = () => {
  // Only run in development or when explicitly enabled
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_ENV === 'true') {
    checkEnvironmentVariables();
  }
}; 