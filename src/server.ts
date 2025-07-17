import express from 'express';
import crypto from 'crypto';
import { supabase } from './integrations/supabase/client.ts';
import { convertSybaseToOracle as convertSybaseToOracleRaw } from './utils/conversionUtils.ts';

const app = express();
app.use(express.json({ limit: '2mb' }));

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

app.post('/api/convert', async (req, res) => {
  const { content, name, aiModel, customPrompt, skipExplanation } = req.body;
  if (!content || !name) return res.status(400).json({ error: 'Missing file content or name.' });
  const contentHash = hashContent(content);
  // Check cache
  const { data: cached } = await supabase
    .from('conversion_cache')
    .select('converted_code')
    .eq('content_hash', contentHash)
    .single();
  if (cached && cached.converted_code) {
    return res.json({
      convertedCode: cached.converted_code,
      fromCache: true
    });
  }
  // Run conversion
  try {
    const result = await convertSybaseToOracleRaw(
      { id: '', name, content, type: 'other' },
      aiModel,
      customPrompt,
      skipExplanation
    );
    // Store in cache
    await supabase.from('conversion_cache').insert([
      {
        content_hash: contentHash,
        original_code: content,
        converted_code: result.convertedCode,
      }
    ]);
    return res.json({
      convertedCode: result.convertedCode,
      fromCache: false
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
}); 