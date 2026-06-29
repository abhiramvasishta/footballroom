import type { Team, Match } from '../types';

export const officialTeams: Team[] = [
  { id: 'ZAF', name: 'South Africa', fifaCode: 'ZAF', countryCode: 'za', flagUrl: 'https://flagcdn.com/w80/za.png', confederation: 'CAF' },
  { id: 'CAN', name: 'Canada', fifaCode: 'CAN', countryCode: 'ca', flagUrl: 'https://flagcdn.com/w80/ca.png', confederation: 'CONCACAF' },
  { id: 'BRA', name: 'Brazil', fifaCode: 'BRA', countryCode: 'br', flagUrl: 'https://flagcdn.com/w80/br.png', confederation: 'CONMEBOL' },
  { id: 'JPN', name: 'Japan', fifaCode: 'JPN', countryCode: 'jp', flagUrl: 'https://flagcdn.com/w80/jp.png', confederation: 'AFC' },
  { id: 'GER', name: 'Germany', fifaCode: 'GER', countryCode: 'de', flagUrl: 'https://flagcdn.com/w80/de.png', confederation: 'UEFA' },
  { id: 'PAR', name: 'Paraguay', fifaCode: 'PAR', countryCode: 'py', flagUrl: 'https://flagcdn.com/w80/py.png', confederation: 'CONMEBOL' },
  { id: 'NED', name: 'Netherlands', fifaCode: 'NED', countryCode: 'nl', flagUrl: 'https://flagcdn.com/w80/nl.png', confederation: 'UEFA' },
  { id: 'MAR', name: 'Morocco', fifaCode: 'MAR', countryCode: 'ma', flagUrl: 'https://flagcdn.com/w80/ma.png', confederation: 'CAF' },
  { id: 'CIV', name: "Ivory Coast", fifaCode: 'CIV', countryCode: 'ci', flagUrl: 'https://flagcdn.com/w80/ci.png', confederation: 'CAF' },
  { id: 'NOR', name: 'Norway', fifaCode: 'NOR', countryCode: 'no', flagUrl: 'https://flagcdn.com/w80/no.png', confederation: 'UEFA' },
  { id: 'FRA', name: 'France', fifaCode: 'FRA', countryCode: 'fr', flagUrl: 'https://flagcdn.com/w80/fr.png', confederation: 'UEFA' },
  { id: 'SWE', name: 'Sweden', fifaCode: 'SWE', countryCode: 'se', flagUrl: 'https://flagcdn.com/w80/se.png', confederation: 'UEFA' },
  { id: 'MEX', name: 'Mexico', fifaCode: 'MEX', countryCode: 'mx', flagUrl: 'https://flagcdn.com/w80/mx.png', confederation: 'CONCACAF' },
  { id: 'ECU', name: 'Ecuador', fifaCode: 'ECU', countryCode: 'ec', flagUrl: 'https://flagcdn.com/w80/ec.png', confederation: 'CONMEBOL' },
  { id: 'ENG', name: 'England', fifaCode: 'ENG', countryCode: 'gb-eng', flagUrl: 'https://flagcdn.com/w80/gb-eng.png', confederation: 'UEFA' },
  { id: 'COD', name: 'DR Congo', fifaCode: 'COD', countryCode: 'cd', flagUrl: 'https://flagcdn.com/w80/cd.png', confederation: 'CAF' },
  { id: 'BEL', name: 'Belgium', fifaCode: 'BEL', countryCode: 'be', flagUrl: 'https://flagcdn.com/w80/be.png', confederation: 'UEFA' },
  { id: 'SEN', name: 'Senegal', fifaCode: 'SEN', countryCode: 'sn', flagUrl: 'https://flagcdn.com/w80/sn.png', confederation: 'CAF' },
  { id: 'USA', name: 'USA', fifaCode: 'USA', countryCode: 'us', flagUrl: 'https://flagcdn.com/w80/us.png', confederation: 'CONCACAF' },
  { id: 'BIH', name: 'Bosnia & Herzegovina', fifaCode: 'BIH', countryCode: 'ba', flagUrl: 'https://flagcdn.com/w80/ba.png', confederation: 'UEFA' },
  { id: 'ESP', name: 'Spain', fifaCode: 'ESP', countryCode: 'es', flagUrl: 'https://flagcdn.com/w80/es.png', confederation: 'UEFA' },
  { id: 'AUT', name: 'Austria', fifaCode: 'AUT', countryCode: 'at', flagUrl: 'https://flagcdn.com/w80/at.png', confederation: 'UEFA' },
  { id: 'POR', name: 'Portugal', fifaCode: 'POR', countryCode: 'pt', flagUrl: 'https://flagcdn.com/w80/pt.png', confederation: 'UEFA' },
  { id: 'CRO', name: 'Croatia', fifaCode: 'CRO', countryCode: 'hr', flagUrl: 'https://flagcdn.com/w80/hr.png', confederation: 'UEFA' },
  { id: 'SUI', name: 'Switzerland', fifaCode: 'SUI', countryCode: 'ch', flagUrl: 'https://flagcdn.com/w80/ch.png', confederation: 'UEFA' },
  { id: 'ALG', name: 'Algeria', fifaCode: 'ALG', countryCode: 'dz', flagUrl: 'https://flagcdn.com/w80/dz.png', confederation: 'CAF' },
  { id: 'AUS', name: 'Australia', fifaCode: 'AUS', countryCode: 'au', flagUrl: 'https://flagcdn.com/w80/au.png', confederation: 'AFC' },
  { id: 'EGY', name: 'Egypt', fifaCode: 'EGY', countryCode: 'eg', flagUrl: 'https://flagcdn.com/w80/eg.png', confederation: 'CAF' },
  { id: 'ARG', name: 'Argentina', fifaCode: 'ARG', countryCode: 'ar', flagUrl: 'https://flagcdn.com/w80/ar.png', confederation: 'CONMEBOL' },
  { id: 'CPV', name: 'Cape Verde', fifaCode: 'CPV', countryCode: 'cv', flagUrl: 'https://flagcdn.com/w80/cv.png', confederation: 'CAF' },
  { id: 'COL', name: 'Colombia', fifaCode: 'COL', countryCode: 'co', flagUrl: 'https://flagcdn.com/w80/co.png', confederation: 'CONMEBOL' },
  { id: 'GHA', name: 'Ghana', fifaCode: 'GHA', countryCode: 'gh', flagUrl: 'https://flagcdn.com/w80/gh.png', confederation: 'CAF' }
];

export const officialMatches: Match[] = [
  // ROUND OF 32
  { id: 'M73', round: 'Round of 32', homeTeamId: 'ZAF', awayTeamId: 'CAN', date: '2026-06-29', kickoff: '2026-06-28T19:00:00Z', stadium: 'SoFi Stadium', city: 'Inglewood, California, USA', completed: false, winnerTeamId: null, nextMatchId: 'M90', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M76', round: 'Round of 32', homeTeamId: 'BRA', awayTeamId: 'JPN', date: '2026-06-29', kickoff: '2026-06-29T17:00:00Z', stadium: 'NRG Stadium', city: 'Houston, Texas, USA', completed: false, winnerTeamId: null, nextMatchId: 'M91', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M74', round: 'Round of 32', homeTeamId: 'GER', awayTeamId: 'PAR', date: '2026-06-30', kickoff: '2026-06-29T20:30:00Z', stadium: 'Gillette Stadium', city: 'Foxborough, Massachusetts, USA', completed: false, winnerTeamId: null, nextMatchId: 'M89', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M75', round: 'Round of 32', homeTeamId: 'NED', awayTeamId: 'MAR', date: '2026-06-30', kickoff: '2026-06-30T00:00:00Z', stadium: 'Estadio BBVA', city: 'Monterrey, Mexico', completed: false, winnerTeamId: null, nextMatchId: 'M90', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M78', round: 'Round of 32', homeTeamId: 'CIV', awayTeamId: 'NOR', date: '2026-06-30', kickoff: '2026-06-30T17:00:00Z', stadium: 'AT&T Stadium', city: 'Arlington, Texas, USA', completed: false, winnerTeamId: null, nextMatchId: 'M91', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M77', round: 'Round of 32', homeTeamId: 'FRA', awayTeamId: 'SWE', date: '2026-07-01', kickoff: '2026-06-30T21:00:00Z', stadium: 'MetLife Stadium', city: 'East Rutherford, New Jersey, USA', completed: false, winnerTeamId: null, nextMatchId: 'M89', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M79', round: 'Round of 32', homeTeamId: 'MEX', awayTeamId: 'ECU', date: '2026-07-01', kickoff: '2026-07-01T00:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico City, Mexico', completed: false, winnerTeamId: null, nextMatchId: 'M92', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M80', round: 'Round of 32', homeTeamId: 'ENG', awayTeamId: 'COD', date: '2026-07-01', kickoff: '2026-07-01T16:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta, Georgia, USA', completed: false, winnerTeamId: null, nextMatchId: 'M92', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M82', round: 'Round of 32', homeTeamId: 'BEL', awayTeamId: 'SEN', date: '2026-07-02', kickoff: '2026-07-01T20:00:00Z', stadium: 'Lumen Field', city: 'Seattle, Washington, USA', completed: false, winnerTeamId: null, nextMatchId: 'M94', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M81', round: 'Round of 32', homeTeamId: 'USA', awayTeamId: 'BIH', date: '2026-07-02', kickoff: '2026-07-02T00:00:00Z', stadium: "Levi's Stadium", city: 'Santa Clara, California, USA', completed: false, winnerTeamId: null, nextMatchId: 'M94', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M84', round: 'Round of 32', homeTeamId: 'ESP', awayTeamId: 'AUT', date: '2026-07-03', kickoff: '2026-07-02T19:00:00Z', stadium: 'SoFi Stadium', city: 'Inglewood, California, USA', completed: false, winnerTeamId: null, nextMatchId: 'M93', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M83', round: 'Round of 32', homeTeamId: 'POR', awayTeamId: 'CRO', date: '2026-07-03', kickoff: '2026-07-02T23:00:00Z', stadium: 'BMO Field', city: 'Toronto, Canada', completed: false, winnerTeamId: null, nextMatchId: 'M93', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M85', round: 'Round of 32', homeTeamId: 'SUI', awayTeamId: 'ALG', date: '2026-07-03', kickoff: '2026-07-03T03:00:00Z', stadium: 'BC Place', city: 'Vancouver, Canada', completed: false, winnerTeamId: null, nextMatchId: 'M96', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M88', round: 'Round of 32', homeTeamId: 'AUS', awayTeamId: 'EGY', date: '2026-07-04', kickoff: '2026-07-03T19:00:00Z', stadium: 'AT&T Stadium', city: 'Arlington, Texas, USA', completed: false, winnerTeamId: null, nextMatchId: 'M95', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M86', round: 'Round of 32', homeTeamId: 'ARG', awayTeamId: 'CPV', date: '2026-07-04', kickoff: '2026-07-03T22:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami Gardens, Florida, USA', completed: false, winnerTeamId: null, nextMatchId: 'M95', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M87', round: 'Round of 32', homeTeamId: 'COL', awayTeamId: 'GHA', date: '2026-07-04', kickoff: '2026-07-04T01:30:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City, Missouri, USA', completed: false, winnerTeamId: null, nextMatchId: 'M96', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },

  // ROUND OF 16
  { id: 'M90', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-04', kickoff: '2026-07-04T17:00:00Z', stadium: 'NRG Stadium', city: 'Houston, Texas, USA', completed: false, winnerTeamId: null, nextMatchId: 'M97', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M89', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-05', kickoff: '2026-07-04T21:00:00Z', stadium: 'Lincoln Financial Field', city: 'Philadelphia, Pennsylvania, USA', completed: false, winnerTeamId: null, nextMatchId: 'M97', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M91', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-06', kickoff: '2026-07-05T20:00:00Z', stadium: 'MetLife Stadium', city: 'East Rutherford, New Jersey, USA', completed: false, winnerTeamId: null, nextMatchId: 'M99', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M92', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-06', kickoff: '2026-07-06T00:00:00Z', stadium: 'Estadio Azteca', city: 'Mexico City, Mexico', completed: false, winnerTeamId: null, nextMatchId: 'M99', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M93', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-07', kickoff: '2026-07-06T19:00:00Z', stadium: 'AT&T Stadium', city: 'Arlington, Texas, USA', completed: false, winnerTeamId: null, nextMatchId: 'M98', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M94', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-07', kickoff: '2026-07-07T00:00:00Z', stadium: 'Lumen Field', city: 'Seattle, Washington, USA', completed: false, winnerTeamId: null, nextMatchId: 'M98', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M95', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-07', kickoff: '2026-07-07T16:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta, Georgia, USA', completed: false, winnerTeamId: null, nextMatchId: 'M100', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M96', round: 'Round of 16', homeTeamId: null, awayTeamId: null, date: '2026-07-08', kickoff: '2026-07-07T20:00:00Z', stadium: 'BC Place', city: 'Vancouver, Canada', completed: false, winnerTeamId: null, nextMatchId: 'M100', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },

  // QUARTER FINALS
  { id: 'M97', round: 'Quarter Finals', homeTeamId: null, awayTeamId: null, date: '2026-07-10', kickoff: '2026-07-09T20:00:00Z', stadium: 'Gillette Stadium', city: 'Foxborough, Massachusetts, USA', completed: false, winnerTeamId: null, nextMatchId: 'M101', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M98', round: 'Quarter Finals', homeTeamId: null, awayTeamId: null, date: '2026-07-11', kickoff: '2026-07-10T19:00:00Z', stadium: 'SoFi Stadium', city: 'Inglewood, California, USA', completed: false, winnerTeamId: null, nextMatchId: 'M101', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M99', round: 'Quarter Finals', homeTeamId: null, awayTeamId: null, date: '2026-07-12', kickoff: '2026-07-11T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami Gardens, Florida, USA', completed: false, winnerTeamId: null, nextMatchId: 'M102', nextSlot: 'home', loserNextMatchId: null, loserNextSlot: null },
  { id: 'M100', round: 'Quarter Finals', homeTeamId: null, awayTeamId: null, date: '2026-07-12', kickoff: '2026-07-12T01:00:00Z', stadium: 'Arrowhead Stadium', city: 'Kansas City, Missouri, USA', completed: false, winnerTeamId: null, nextMatchId: 'M102', nextSlot: 'away', loserNextMatchId: null, loserNextSlot: null },

  // SEMI FINALS
  { id: 'M101', round: 'Semi Finals', homeTeamId: null, awayTeamId: null, date: '2026-07-15', kickoff: '2026-07-14T19:00:00Z', stadium: 'MetLife Stadium', city: 'East Rutherford, New Jersey, USA', completed: false, winnerTeamId: null, nextMatchId: 'M104', nextSlot: 'home', loserNextMatchId: 'M103', loserNextSlot: 'home' },
  { id: 'M102', round: 'Semi Finals', homeTeamId: null, awayTeamId: null, date: '2026-07-16', kickoff: '2026-07-15T19:00:00Z', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta, Georgia, USA', completed: false, winnerTeamId: null, nextMatchId: 'M104', nextSlot: 'away', loserNextMatchId: 'M103', loserNextSlot: 'away' },

  // THIRD PLACE
  { id: 'M103', round: 'Third Place', homeTeamId: null, awayTeamId: null, date: '2026-07-19', kickoff: '2026-07-18T21:00:00Z', stadium: 'Hard Rock Stadium', city: 'Miami Gardens, Florida, USA', completed: false, winnerTeamId: null, nextMatchId: null, nextSlot: null, loserNextMatchId: null, loserNextSlot: null },

  // FINAL
  { id: 'M104', round: 'Final', homeTeamId: null, awayTeamId: null, date: '2026-07-20', kickoff: '2026-07-19T19:00:00Z', stadium: 'MetLife Stadium', city: 'East Rutherford, New Jersey, USA', completed: false, winnerTeamId: null, nextMatchId: null, nextSlot: null, loserNextMatchId: null, loserNextSlot: null }
];
