// Venmo deep link generator for payment requests

function generateRequestUrl(handle, amount, note) {
  if (!handle) return null;

  const cleanHandle = handle.replace(/^@/, '');
  const encodedNote = encodeURIComponent(note || '');
  const formattedAmount = parseFloat(amount).toFixed(2);

  return {
    web: `https://venmo.com/${cleanHandle}?txn=charge&amount=${formattedAmount}&note=${encodedNote}`,
    app: `venmo://paycharge?txn=charge&recipients=${cleanHandle}&amount=${formattedAmount}&note=${encodedNote}`,
  };
}

function generateRequestText(handle, amount, gameDescription) {
  if (!handle || !amount || amount <= 0) return null;

  const urls = generateRequestUrl(handle, amount, `BenchBuddies: ${gameDescription}`);
  if (!urls) return null;

  return {
    urls,
    formatted: `Pay $${parseFloat(amount).toFixed(2)} via Venmo: ${urls.web}`,
    amount: parseFloat(amount).toFixed(2),
  };
}

function buildPaymentNote(teamName, opponent, gameDate, section) {
  const parts = [`${teamName} vs ${opponent}`];
  if (gameDate) parts.push(gameDate);
  if (section) parts.push(`Section ${section}`);
  return `BenchBuddies: ${parts.join(' - ')}`;
}

module.exports = { generateRequestUrl, generateRequestText, buildPaymentNote };
