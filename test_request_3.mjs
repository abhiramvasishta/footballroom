import http from 'node:http';
import https from 'node:https';

const url = 'https://footballroom.up.railway.app/api/stream/video_e3303de4%0A';

async function testGetWithNewline() {
  console.log('\n--- GET Request (with newline) ---');
  const res = await fetch(url, {
    method: 'GET',
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

testGetWithNewline();
