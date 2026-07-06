import https from 'https';

https.get('https://dlhd.st/stream/stream-111.php', (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
}).on('error', (e) => {
  console.error(e);
});
