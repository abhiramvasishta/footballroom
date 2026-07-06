import https from 'https';

https.get('https://dlhd.st/stream/stream-111.php', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = iframeRegex.exec(data)) !== null) {
      console.log('IFRAME SRC:', match[1]);
    }
    const m3u8Regex = /https?:\/\/[^\s"'<>]+\.m3u8/gi;
    while ((match = m3u8Regex.exec(data)) !== null) {
      console.log('M3U8 SRC:', match[0]);
    }
  });
}).on('error', console.error);
