const http = require('http');

const url = 'http://localhost:3000/api/practice?skill=template-addition-apple-counting&subject=math&topic=addition&seed=123';

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Success:', json.success);
      if (json.success && json.question) {
        console.log('Question keys:', Object.keys(json.question));
        console.log('Question type:', json.question.type);
        console.log('Question metadata:', JSON.stringify(json.question.metadata, null, 2));
        console.log('Question metaConfig:', JSON.stringify(json.question.metaConfig, null, 2));
      } else {
        console.log('Failed:', json.error || json);
      }
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
  });
});
