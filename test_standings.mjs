import http from 'node:http';
import https from 'node:https';

async function testStandings() {
  const url = 'https://footballroom.up.railway.app//api/fifa/standings';
  console.log('\n--- GET Standings (double slash) ---');
  const res = await fetch(url);
  console.log('Status:', res.status);
}

testStandings();
