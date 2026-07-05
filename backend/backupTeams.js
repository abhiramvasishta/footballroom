const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env.development' });
dotenv.config({ path: './.env' }); // try backend .env as well

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase credentials in environment");
  process.exit(1);
}

initializeApp({
  credential: cert({ projectId, clientEmail, privateKey })
});

const db = getFirestore();

async function backup() {
  console.log("Backing up 'teams' collection...");
  const snapshot = await db.collection('teams').get();
  const teams = {};
  snapshot.forEach(doc => {
    teams[doc.id] = doc.data();
  });
  
  const backupPath = '../teams_backup.json';
  fs.writeFileSync(backupPath, JSON.stringify(teams, null, 2));
  console.log(`Backup saved to ${backupPath} (${Object.keys(teams).length} teams)`);
}

backup().catch(console.error);
