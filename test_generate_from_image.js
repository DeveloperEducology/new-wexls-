const fs = require('fs');
const path = require('path');

async function main() {
  // Use a real image from the user uploaded folder if it exists, otherwise fallback to a dummy file
  const realImagePath = '/Users/vijay/.gemini/antigravity/brain/1c2bfaa0-4ebb-4ec5-876b-2b59e436a662/.user_uploaded/media__1784275353330.png';
  let buffer;
  let filename = 'test-image.png';
  let type = 'image/png';

  if (fs.existsSync(realImagePath)) {
    buffer = fs.readFileSync(realImagePath);
    console.log(`Using real image at: ${realImagePath} (${buffer.length} bytes)`);
  } else {
    buffer = Buffer.from('dummy image content');
    console.log('Using dummy image content');
  }

  const blob = new Blob([buffer], { type });
  const file = new File([blob], filename, { type });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('subject', 'english');
  formData.append('topic', 'phonics');
  formData.append('skillId', 'cvc-words');
  formData.append('difficulty', 'easy');
  formData.append('count', '2');

  try {
    const res = await fetch('http://localhost:3000/api/admin/questions/generate-from-image', {
      method: 'POST',
      body: formData
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
