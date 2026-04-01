import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface MLBGame {
  homeTeam: string;
  homeAbbr: string;
  homeScore: number | null;
  awayTeam: string;
  awayAbbr: string;
  awayScore: number | null;
  status: string; // "Final", "In Progress", "Preview", etc.
  inning?: string;
  gameDate: string;
}

// MLB team ID to abbreviation mapping
const TEAM_ABBR: Record<number, string> = {
  108: 'LAA', 109: 'AZ', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET', 117: 'HOU',
  118: 'KC', 119: 'LAD', 120: 'WSH', 121: 'NYM', 133: 'OAK',
  134: 'PIT', 135: 'SD', 136: 'SEA', 137: 'SF', 138: 'STL',
  139: 'TB', 140: 'TEX', 141: 'TOR', 142: 'MIN', 143: 'PHI',
  144: 'ATL', 145: 'CWS', 146: 'MIA', 147: 'NYY', 158: 'MIL',
};

export async function GET(req: NextRequest) {
  // Design mode: return mock scores
  if (process.env.NEXT_PUBLIC_DESIGN_MODE === 'true') {
    const mockGames = [
      { homeTeam: 'San Diego Padres', homeAbbr: 'SD', homeScore: 5, awayTeam: 'Los Angeles Dodgers', awayAbbr: 'LAD', awayScore: 3, status: 'Final', gameDate: '2026-03-26' },
      { homeTeam: 'San Francisco Giants', homeAbbr: 'SF', homeScore: 2, awayTeam: 'Arizona Diamondbacks', awayAbbr: 'AZ', awayScore: 4, status: 'Final', gameDate: '2026-03-26' },
      { homeTeam: 'New York Yankees', homeAbbr: 'NYY', homeScore: 7, awayTeam: 'Boston Red Sox', awayAbbr: 'BOS', awayScore: 6, status: 'Bot 8', gameDate: '2026-03-26' },
      { homeTeam: 'Chicago Cubs', homeAbbr: 'CHC', homeScore: 1, awayTeam: 'St. Louis Cardinals', awayAbbr: 'STL', awayScore: 0, status: 'Top 5', gameDate: '2026-03-26' },
      { homeTeam: 'Atlanta Braves', homeAbbr: 'ATL', homeScore: null, awayTeam: 'Philadelphia Phillies', awayAbbr: 'PHI', awayScore: null, status: 'Preview', gameDate: '2026-03-26' },
      { homeTeam: 'Houston Astros', homeAbbr: 'HOU', homeScore: 3, awayTeam: 'Texas Rangers', awayAbbr: 'TEX', awayScore: 3, status: 'Top 7', gameDate: '2026-03-26' },
      { homeTeam: 'Colorado Rockies', homeAbbr: 'COL', homeScore: null, awayTeam: 'Milwaukee Brewers', awayAbbr: 'MIL', awayScore: null, status: 'Preview', gameDate: '2026-03-26' },
      { homeTeam: 'Seattle Mariners', homeAbbr: 'SEA', homeScore: 2, awayTeam: 'Oakland Athletics', awayAbbr: 'OAK', awayScore: 1, status: 'Final', gameDate: '2026-03-26' },
    ];
    const featured = mockGames[0];
    return NextResponse.json({ games: mockGames, featured });
  }

  try {
    const dateParam = req.nextUrl.searchParams.get('date');
    const today = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().split('T')[0];
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}&hydrate=linescore,team`;

    const response = await fetch(url, { next: { revalidate: 30 } });

    if (!response.ok) {
      return NextResponse.json({ games: [], featured: null });
    }

    const data = await response.json();
    const games: MLBGame[] = [];

    for (const date of data.dates || []) {
      for (const game of date.games || []) {
        const home = game.teams?.home;
        const away = game.teams?.away;
        const linescore = game.linescore;

        const homeId = home?.team?.id;
        const awayId = away?.team?.id;

        let status = 'Preview';
        const abstractState = game.status?.abstractGameState;
        const detailedState = game.status?.detailedState;

        if (abstractState === 'Final') {
          status = 'Final';
        } else if (abstractState === 'Live') {
          const inning = linescore?.currentInning;
          const half = linescore?.inningHalf;
          status = `${half === 'Top' ? 'Top' : 'Bot'} ${inning}`;
        } else {
          // Show start time for scheduled games (e.g. "1:10 PM")
          const startTime = game.gameDate
            ? new Date(game.gameDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'America/Los_Angeles',
              })
            : null;
          status = startTime || detailedState || 'Preview';
        }

        games.push({
          homeTeam: home?.team?.name || 'Unknown',
          homeAbbr: TEAM_ABBR[homeId] || home?.team?.abbreviation || '???',
          homeScore: abstractState !== 'Preview' ? (home?.score ?? null) : null,
          awayTeam: away?.team?.name || 'Unknown',
          awayAbbr: TEAM_ABBR[awayId] || away?.team?.abbreviation || '???',
          awayScore: abstractState !== 'Preview' ? (away?.score ?? null) : null,
          status,
          gameDate: game.gameDate || today,
        });
      }
    }

    // Featured game: prefer Padres, then most recent final
    const featured =
      games.find(
        (g) =>
          (g.homeAbbr === 'SD' || g.awayAbbr === 'SD') &&
          g.status === 'Final'
      ) ||
      games.find((g) => g.homeAbbr === 'SD' || g.awayAbbr === 'SD') ||
      games.find((g) => g.status === 'Final') ||
      games[0] ||
      null;

    return NextResponse.json({ games, featured });
  } catch (error) {
    console.error('Failed to fetch MLB scores:', error);
    return NextResponse.json({ games: [], featured: null });
  }
}
