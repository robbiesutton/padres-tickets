// Transfer instruction engine — reads from ticketing_platforms table
const db = require('../db');

function getTransferInstructions(teamId) {
  const team = db.db.prepare(`
    SELECT t.*, tp.name as platform_name, tp.transfer_method,
           tp.transfer_url_template, tp.transfer_instructions, tp.accept_instructions
    FROM teams t
    LEFT JOIN ticketing_platforms tp ON tp.id = t.ticketing_platform_id
    WHERE t.id = ?
  `).get(teamId);

  if (!team) return null;

  const steps = team.transfer_instructions
    ? team.transfer_instructions.split('\n').filter(s => s.trim())
    : [];

  // Build deep link from template if available
  let deepLink = null;
  if (team.transfer_url_template) {
    const slug = team.abbreviation ? team.abbreviation.toLowerCase() : team.name.toLowerCase();
    deepLink = team.transfer_url_template.replace('{{team_slug}}', slug);
  }

  return {
    steps,
    deepLink,
    platformName: team.platform_name || 'your ticketing app',
    transferMethod: team.transfer_method || 'email',
    teamName: team.full_name || team.name,
    venueName: team.venue_name,
  };
}

function getTransferUrl(teamId) {
  const info = getTransferInstructions(teamId);
  return info?.deepLink || null;
}

function getAcceptInstructions(teamId) {
  const team = db.db.prepare(`
    SELECT tp.accept_instructions, tp.name as platform_name
    FROM teams t
    LEFT JOIN ticketing_platforms tp ON tp.id = t.ticketing_platform_id
    WHERE t.id = ?
  `).get(teamId);

  if (!team) return null;

  return {
    steps: team.accept_instructions
      ? team.accept_instructions.split('\n').filter(s => s.trim())
      : [],
    platformName: team.platform_name || 'your ticketing app',
  };
}

module.exports = { getTransferInstructions, getTransferUrl, getAcceptInstructions };
