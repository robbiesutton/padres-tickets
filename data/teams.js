// Seed data for leagues, teams, and ticketing platforms
// Start with MLB, expand to other leagues later

const leagues = [
  { name: 'MLB', sport: 'baseball', country: 'US' },
];

// Ticketing platform reference data (PRD section 10.4)
const ticketingPlatforms = [
  {
    name: 'Ticketmaster',
    transfer_method: 'email',
    transfer_url_template: 'https://am.ticketmaster.com/{{team_slug}}/mytickets',
    transfer_instructions: '1. Open MLB Ballpark app or Ticketmaster app\n2. Go to "My Tickets"\n3. Select the game\n4. Tap "Transfer"\n5. Enter the recipient\'s email address\n6. Confirm the transfer',
    accept_instructions: '1. Check your email for a transfer notification from Ticketmaster\n2. Tap "Accept Tickets"\n3. Sign in to your Ticketmaster account (or create one)\n4. Tickets will appear in your MLB Ballpark or Ticketmaster app',
  },
  {
    name: 'AXS',
    transfer_method: 'email',
    transfer_url_template: 'https://flash-seats.com/myaccount/EventTickets',
    transfer_instructions: '1. Open the AXS app or go to axs.com\n2. Go to "My Tickets"\n3. Select the game\n4. Tap "Send" or "Transfer"\n5. Enter the recipient\'s email address\n6. Confirm the transfer',
    accept_instructions: '1. Check your email for a transfer notification from AXS\n2. Tap "Accept"\n3. Sign in to your AXS account (or create one)\n4. Tickets will appear in your AXS app',
  },
  {
    name: 'SeatGeek',
    transfer_method: 'in-app',
    transfer_url_template: 'https://seatgeek.com/settings/tickets',
    transfer_instructions: '1. Open the SeatGeek app\n2. Go to "My Tickets"\n3. Select the game\n4. Tap "Send Tickets"\n5. Enter the recipient\'s email or SeatGeek username\n6. Confirm',
    accept_instructions: '1. Check your email or SeatGeek app for the ticket notification\n2. Accept the tickets in the SeatGeek app\n3. Tickets will appear in your "My Tickets" section',
  },
];

const teams = [
  // MLB - National League West
  { league: 'MLB', name: 'Padres', city: 'San Diego', full_name: 'San Diego Padres', abbreviation: 'SD', venue_name: 'Petco Park', primary_color: '#2F241D', accent_color: '#FFC425', time_zone: 'America/Los_Angeles', platform: 'Ticketmaster', transfer_app: 'ballpark', account_manager_slug: 'padres' },
  { league: 'MLB', name: 'Dodgers', city: 'Los Angeles', full_name: 'Los Angeles Dodgers', abbreviation: 'LAD', venue_name: 'Dodger Stadium', primary_color: '#005A9C', accent_color: '#EF3E42', time_zone: 'America/Los_Angeles', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Giants', city: 'San Francisco', full_name: 'San Francisco Giants', abbreviation: 'SF', venue_name: 'Oracle Park', primary_color: '#FD5A1E', accent_color: '#27251F', time_zone: 'America/Los_Angeles', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Diamondbacks', city: 'Phoenix', full_name: 'Arizona Diamondbacks', abbreviation: 'ARI', venue_name: 'Chase Field', primary_color: '#A71930', accent_color: '#E3D4AD', time_zone: 'America/Phoenix', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Rockies', city: 'Denver', full_name: 'Colorado Rockies', abbreviation: 'COL', venue_name: 'Coors Field', primary_color: '#33006F', accent_color: '#C4CED4', time_zone: 'America/Denver', platform: 'Ticketmaster' },

  // MLB - National League East
  { league: 'MLB', name: 'Braves', city: 'Atlanta', full_name: 'Atlanta Braves', abbreviation: 'ATL', venue_name: 'Truist Park', primary_color: '#CE1141', accent_color: '#13274F', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Mets', city: 'New York', full_name: 'New York Mets', abbreviation: 'NYM', venue_name: 'Citi Field', primary_color: '#002D72', accent_color: '#FF5910', time_zone: 'America/New_York', platform: 'SeatGeek' },
  { league: 'MLB', name: 'Phillies', city: 'Philadelphia', full_name: 'Philadelphia Phillies', abbreviation: 'PHI', venue_name: 'Citizens Bank Park', primary_color: '#E81828', accent_color: '#002D72', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Marlins', city: 'Miami', full_name: 'Miami Marlins', abbreviation: 'MIA', venue_name: 'LoanDepot Park', primary_color: '#00A3E0', accent_color: '#EF3340', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Nationals', city: 'Washington', full_name: 'Washington Nationals', abbreviation: 'WSH', venue_name: 'Nationals Park', primary_color: '#AB0003', accent_color: '#14225A', time_zone: 'America/New_York', platform: 'Ticketmaster' },

  // MLB - National League Central
  { league: 'MLB', name: 'Cubs', city: 'Chicago', full_name: 'Chicago Cubs', abbreviation: 'CHC', venue_name: 'Wrigley Field', primary_color: '#0E3386', accent_color: '#CC3433', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Cardinals', city: 'St. Louis', full_name: 'St. Louis Cardinals', abbreviation: 'STL', venue_name: 'Busch Stadium', primary_color: '#C41E3A', accent_color: '#0C2340', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Brewers', city: 'Milwaukee', full_name: 'Milwaukee Brewers', abbreviation: 'MIL', venue_name: 'American Family Field', primary_color: '#12284B', accent_color: '#FFC52F', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Reds', city: 'Cincinnati', full_name: 'Cincinnati Reds', abbreviation: 'CIN', venue_name: 'Great American Ball Park', primary_color: '#C6011F', accent_color: '#000000', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Pirates', city: 'Pittsburgh', full_name: 'Pittsburgh Pirates', abbreviation: 'PIT', venue_name: 'PNC Park', primary_color: '#27251F', accent_color: '#FDB827', time_zone: 'America/New_York', platform: 'Ticketmaster' },

  // MLB - American League West
  { league: 'MLB', name: 'Angels', city: 'Los Angeles', full_name: 'Los Angeles Angels', abbreviation: 'LAA', venue_name: 'Angel Stadium', primary_color: '#BA0021', accent_color: '#003263', time_zone: 'America/Los_Angeles', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Astros', city: 'Houston', full_name: 'Houston Astros', abbreviation: 'HOU', venue_name: 'Minute Maid Park', primary_color: '#002D62', accent_color: '#EB6E1F', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Mariners', city: 'Seattle', full_name: 'Seattle Mariners', abbreviation: 'SEA', venue_name: 'T-Mobile Park', primary_color: '#0C2C56', accent_color: '#005C5C', time_zone: 'America/Los_Angeles', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Athletics', city: 'Sacramento', full_name: 'Sacramento Athletics', abbreviation: 'OAK', venue_name: 'Sutter Health Park', primary_color: '#003831', accent_color: '#EFB21E', time_zone: 'America/Los_Angeles', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Rangers', city: 'Arlington', full_name: 'Texas Rangers', abbreviation: 'TEX', venue_name: 'Globe Life Field', primary_color: '#003278', accent_color: '#C0111F', time_zone: 'America/Chicago', platform: 'Ticketmaster' },

  // MLB - American League East
  { league: 'MLB', name: 'Yankees', city: 'New York', full_name: 'New York Yankees', abbreviation: 'NYY', venue_name: 'Yankee Stadium', primary_color: '#003087', accent_color: '#E4002C', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Red Sox', city: 'Boston', full_name: 'Boston Red Sox', abbreviation: 'BOS', venue_name: 'Fenway Park', primary_color: '#BD3039', accent_color: '#0C2340', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Blue Jays', city: 'Toronto', full_name: 'Toronto Blue Jays', abbreviation: 'TOR', venue_name: 'Rogers Centre', primary_color: '#134A8E', accent_color: '#E8291C', time_zone: 'America/Toronto', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Rays', city: 'St. Petersburg', full_name: 'Tampa Bay Rays', abbreviation: 'TB', venue_name: 'Tropicana Field', primary_color: '#092C5C', accent_color: '#8FBCE6', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Orioles', city: 'Baltimore', full_name: 'Baltimore Orioles', abbreviation: 'BAL', venue_name: 'Oriole Park at Camden Yards', primary_color: '#DF4601', accent_color: '#27251F', time_zone: 'America/New_York', platform: 'Ticketmaster' },

  // MLB - American League Central
  { league: 'MLB', name: 'White Sox', city: 'Chicago', full_name: 'Chicago White Sox', abbreviation: 'CWS', venue_name: 'Guaranteed Rate Field', primary_color: '#27251F', accent_color: '#C4CED4', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Guardians', city: 'Cleveland', full_name: 'Cleveland Guardians', abbreviation: 'CLE', venue_name: 'Progressive Field', primary_color: '#00385D', accent_color: '#E50022', time_zone: 'America/New_York', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Tigers', city: 'Detroit', full_name: 'Detroit Tigers', abbreviation: 'DET', venue_name: 'Comerica Park', primary_color: '#0C2340', accent_color: '#FA4616', time_zone: 'America/Detroit', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Royals', city: 'Kansas City', full_name: 'Kansas City Royals', abbreviation: 'KC', venue_name: 'Kauffman Stadium', primary_color: '#004687', accent_color: '#BD9B60', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
  { league: 'MLB', name: 'Twins', city: 'Minneapolis', full_name: 'Minnesota Twins', abbreviation: 'MIN', venue_name: 'Target Field', primary_color: '#002B5C', accent_color: '#D31145', time_zone: 'America/Chicago', platform: 'Ticketmaster' },
];

module.exports = { leagues, teams, ticketingPlatforms };
