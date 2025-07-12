# API Diagnostic Guide - Conversion Issues

## Problem
Your files are not converting to Oracle. This could be due to either:
1. **API Key Issues** - Invalid or missing Gemini API key
2. **Code Issues** - Problems in the conversion logic
3. **Network Issues** - Connection problems

## Quick Diagnosis Steps

### 1. Check API Key Status
The current API key being used is: `AIzaSyBbhyMmUtGdJhDDUHh7ecI1qsYjR9WQSXU`

**To test the API:**
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Click the "Test API" button in the Conversion panel
4. Check the console output for API test results

### 2. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Try to convert a file
4. Look for error messages like:
   - `API_KEY_INVALID`
   - `quota exceeded`
   - `rate limit`
   - `network error`
   - `timeout`

### 3. Common Issues and Solutions

#### Issue 1: Invalid API Key
**Symptoms:** Error messages about authentication or API key
**Solution:** 
- Get a new API key from Google AI Studio (https://makersuite.google.com/app/apikey)
- Create a `.env` file in your project root with:
  ```
  VITE_GEMINI_API_KEY=your_new_api_key_here
  ```

#### Issue 2: API Quota Exceeded
**Symptoms:** "quota exceeded" or "rate limit" errors
**Solution:**
- Check your Google AI Studio quota
- Wait for quota reset or upgrade your plan

#### Issue 3: Network Issues
**Symptoms:** "network error" or "fetch failed"
**Solution:**
- Check your internet connection
- Try again later

#### Issue 4: Code Issues
**Symptoms:** Files fail with generic "Conversion failed" errors
**Solution:**
- Check the browser console for detailed error messages
- The enhanced error logging should show specific issues

## Enhanced Error Logging

I've added comprehensive error logging to help diagnose issues:

1. **API Key Validation** - Checks if API key is present and valid
2. **File Content Validation** - Ensures files have content to convert
3. **Detailed API Error Messages** - Shows specific error types
4. **Test API Button** - Allows you to test the API connection directly

## Next Steps

1. **Click the "Test API" button** in the Conversion panel
2. **Check the browser console** for detailed error messages
3. **Try converting a simple file** and watch the console output
4. **Report the specific error messages** you see

## Expected Console Output

When working correctly, you should see:
```
=== GEMINI API TEST ===
API Key present: true
API Key length: 39
API Key preview: AIzaSyBbhy...
Testing with prompt: Say "Hello World"
✅ API test successful: {data...}
```

If there are issues, you'll see specific error messages that will help identify the problem.

## Getting a New API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the new key
5. Create a `.env` file in your project root:
   ```
   VITE_GEMINI_API_KEY=your_new_api_key_here
   ```
6. Restart your development server

This should resolve the conversion issues! 