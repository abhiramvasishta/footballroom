import http from 'node:http';
import https from 'node:https';

const url = 'https://footballroom.up.railway.app/api/stream/video_e3303de4';

async function testOptions() {
  console.log('--- OPTIONS Request ---');
  const res = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://footballroom.vercel.app',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'range'
    }
  });
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log('Body:', text);
}

async function testGetWithRange() {
  console.log('\n--- GET Request (with Range) ---');
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Origin': 'https://footballroom.vercel.app',
      'Range': 'bytes=0-'
    }
  });
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  
  if (res.status === 404 || !res.headers.get('content-type')?.includes('video')) {
      const text = await res.text();
      console.log('Body:', text);
  } else {
      console.log('Body: <binary/stream>');
  }
}

async function run() {
  await testOptions();
  await testGetWithRange();
}

run();
