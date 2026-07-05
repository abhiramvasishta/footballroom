const fs = require('fs');

async function diagnose() {
  const backupMatchesRaw = fs.readFileSync('../matches_backup.json');
  const matchesObj = JSON.parse(backupMatchesRaw);
  const localMatches = Object.values(matchesObj);

  const backupTeamsRaw = fs.readFileSync('../teams_backup.json');
  const teamsObj = JSON.parse(backupTeamsRaw);
  const localTeams = Object.values(teamsObj);

  // Fetch exactly what the frontend fetches
  const apiUrl = 'https://footballroom.onrender.com';
  console.log(`Fetching from ${apiUrl}/api/fifa/today ...`);
  const response = await fetch(`${apiUrl}/api/fifa/today`);
  const apiFixtures = await response.json();
  
  console.log("=== RAW JSON FROM /api/fifa/today ===");
  console.log(JSON.stringify(apiFixtures, null, 2));
  console.log("=======================================\n");

  console.log("=== MATCH DIAGNOSTICS ===");

  for (const localMatch of localMatches) {
    if (!localMatch.homeTeamId || !localMatch.awayTeamId) {
      // Ignore placeholders for diagnostics
      continue;
    }
    
    const homeTeam = localTeams.find(t => t.id === localMatch.homeTeamId);
    const awayTeam = localTeams.find(t => t.id === localMatch.awayTeamId);
    
    if (!homeTeam || !awayTeam) continue;

    console.log(`\nMatch: ${localMatch.id}`);
    console.log(`Teams: ${homeTeam.name} vs ${awayTeam.name}`);
    console.log(`Completed in Firestore: ${localMatch.completed}`);

    if (localMatch.completed) {
      console.log(`Result: SKIPPED (already completed in Firestore)`);
      continue;
    }

    // Try mapping
    const apiMatch = apiFixtures.find(f => {
      const apiHome = f.homeTeam.toLowerCase();
      const apiAway = f.awayTeam.toLowerCase();
      const localHome = homeTeam.name.toLowerCase();
      const localAway = awayTeam.name.toLowerCase();
      
      return (apiHome === localHome && apiAway === localAway) || 
             (apiHome === localAway && apiAway === localHome);
    });

    if (!apiMatch) {
      console.log(`ESPN match found: false`);
      console.log(`Result: SKIPPED (no ESPN match found / team-name mismatch)`);
      continue;
    }

    console.log(`ESPN match found: true`);
    console.log(`ESPN match ID: ${apiMatch.id}`);
    console.log(`ESPN status: ${apiMatch.status}`);

    if (apiMatch.status === 0 || apiMatch.status === 3) {
      console.log(`Result: SUCCESS (Would sync)`);
    } else {
      console.log(`Result: SKIPPED (ESPN status not eligible. 0 or 3 required, found ${apiMatch.status})`);
    }
  }
}

diagnose().catch(console.error);
