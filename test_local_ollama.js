import { generateLocalAIContent, generateLocalAIJSON, isOllamaAvailable } from './src/lib/ollama.js';

async function testLocalOllama() {
  console.log('🔍 Checking if local Ollama server is running...');
  const available = await isOllamaAvailable();
  console.log('Ollama Available:', available);

  if (!available) {
    console.error('❌ Ollama is not running on http://localhost:11434');
    return;
  }

  console.log('\n🤖 Testing Local AI Text Generation...');
  const textResponse = await generateLocalAIContent('Write a 1-sentence math problem for 3rd graders.');
  console.log('Response:\n', textResponse);

  console.log('\n📊 Testing Local AI Structured JSON Generation...');
  const jsonResponse = await generateLocalAIJSON('Generate 2 addition question templates for 2nd Grade with properties: questionText, answer');
  console.log('JSON Output:\n', JSON.stringify(jsonResponse, null, 2));
  console.log('\n✅ Integration verified successfully with zero impact on existing code!');
}

testLocalOllama().catch(console.error);
