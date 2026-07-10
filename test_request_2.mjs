import http from 'node:http';
import https from 'node:https';

const url = 'https://footballroom.up.railway.app//api/stream/video_e3303de4';

async function testGetWithDoubleSlash() {
  console.log('\n--- GET Request (with double slash) ---');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Origin': 'https://footballroom.vercel.app'
    }
  });
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log('Body:', text);
}

testGetWithDoubleSlash();
