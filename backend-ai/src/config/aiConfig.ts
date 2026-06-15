/** OpenAI model config — override via environment variables */
export const aiConfig = {
  model:      process.env.OPENAI_MODEL   || 'gpt-4o-mini',
  apiKey:     process.env.OPENAI_API_KEY || '',
  maxRetries: process.env.NODE_ENV === 'production' ? 3 : 1,
  timeoutMs:  process.env.NODE_ENV === 'production' ? 120000 : 60000,
};
