const fs = require('fs');
const https = require('https');
const path = require('path');

const players = [
  'Lionel Messi',
  'Kylian Mbappé',
  'Vinícius Júnior',
  'Ousmane Dembélé',
  'Erling Haaland',
  'Harry Kane',
  'Ismaïla Sarr',
  'Jonathan David',
  'Matheus Cunha',
  'Brian Brobbey',
  'Deniz Undav',
  'Yoane Wissa',
  'Daichi Kamada',
  'Ayase Ueda',
  'Cristiano Ronaldo',
  'Jude Bellingham',
  'Cody Gakpo',
  'Elijah Just',
  'Ismael Saibari',
  'Johan Manzambi'
];

const dir = path.join(__dirname, 'public', 'players');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filename);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
      } else {
        resolve(false);
      }
    }).on('error', reject);
  });
}

async function run() {
  const mapping = {};
  for (const player of players) {
    const safeName = player.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${safeName}.png`;
    const filepath = path.join(dir, filename);
    
    console.log(`Fetching ${player}...`);
    
    // Get URL from sports db
    let imgUrl = null;
    await new Promise((resolve) => {
      https.get('https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=' + encodeURIComponent(player), res => {
        let d='';
        res.on('data', c=>d+=c);
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            if (j.player) {
              imgUrl = j.player[0].strCutout || j.player[0].strThumb;
            }
          } catch(e) {}
          resolve();
        });
      });
    });

    if (imgUrl) {
      const success = await downloadImage(imgUrl, filepath);
      if (success) {
        mapping[player] = `/players/${filename}`;
        console.log(`  -> Downloaded ${filename}`);
      } else {
        console.log(`  -> Failed to download image from URL for ${player}`);
        mapping[player] = `/players/${filename}`;
      }
    } else {
      console.log(`  -> No URL found for ${player}`);
      mapping[player] = `/players/${filename}`;
    }
    
    await delay(100); 
  }

  const tsContent = `export const PLAYER_IMAGES: Record<string, string> = ${JSON.stringify(mapping, null, 2)};\n`;
  fs.writeFileSync(path.join(__dirname, 'src', 'data', 'playerImages.ts'), tsContent, 'utf8');
  console.log('Done! Mapping saved to src/data/playerImages.ts');
}

run();
