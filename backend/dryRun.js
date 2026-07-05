const fs = require('fs');

async function dryRun() {
  const backupMatchesRaw = fs.readFileSync('../matches_backup.json');
  const matchesObj = JSON.parse(backupMatchesRaw);
  const localMatches = Object.values(matchesObj);

  const backupTeamsRaw = fs.readFileSync('../teams_backup.json');
  const teamsObj = JSON.parse(backupTeamsRaw);
  const localTeams = Object.values(teamsObj);

  // Fetch from ESPN (same logic our backend does)
  const espnRes = await fetch('http://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
  const espnData = await espnRes.json();
  const espnEvents = espnData.events || [];

  console.log("ESPN DRY RUN MATCHING:");
  
  for (const espnMatch of espnEvents) {
    const comp = espnMatch.competitions[0];
    const homeNode = comp.competitors.find(c => c.homeAway === 'home');
    const awayNode = comp.competitors.find(c => c.homeAway === 'away');
    
    if (!homeNode || !awayNode) continue;
    
    const apiHome = homeNode.team.name.toLowerCase();
    const apiAway = awayNode.team.name.toLowerCase();
    
    let matchedLocal = null;
    let localHomeName = '';
    let localAwayName = '';

    for (const localMatch of localMatches) {
      if (!localMatch.homeTeamId || !localMatch.awayTeamId) continue;
      const hTeam = localTeams.find(t => t.id === localMatch.homeTeamId);
      const aTeam = localTeams.find(t => t.id === localMatch.awayTeamId);
      if (!hTeam || !aTeam) continue;
      
      const lHome = hTeam.name.toLowerCase();
      const lAway = aTeam.name.toLowerCase();
      
      if ((apiHome === lHome && apiAway === lAway) || (apiHome === lAway && apiAway === lHome)) {
        matchedLocal = localMatch;
        localHomeName = hTeam.name;
        localAwayName = aTeam.name;
        break;
      }
    }

    if (matchedLocal) {
      console.log(`${matchedLocal.id} ← ESPN ${espnMatch.id} (${localHomeName} vs ${localAwayName}) -> [SUCCESS] Mapped properly.`);
    } else {
      console.warn(`[WARNING] Skipping ESPN ${espnMatch.id} (${homeNode.team.name} vs ${awayNode.team.name}) -> Cannot find in Firestore!`);
    }
  }
}

dryRun().catch(console.error);
