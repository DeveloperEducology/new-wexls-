const fs = require('fs');
const path = require('path');

async function main() {
  const dummyBuffer = Buffer.from('dummy image content');
  const blob = new Blob([dummyBuffer], { type: 'image/png' });
  const file = new File([blob], 'test-image.png', { type: 'image/png' });

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('http://localhost:3000/api/admin/upload-image', {
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
