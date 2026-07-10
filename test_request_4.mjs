import http from 'node:http';
import https from 'node:https';

const url = 'https://footballroom.up.railway.app/notfound?foo=bar';

async function testQueryString() {
  console.log('\n--- GET Request (with query string) ---');
  const res = await fetch(url);
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

testQueryString();
