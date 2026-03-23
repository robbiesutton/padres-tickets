export interface StadiumSection {
  id: string;
  name: string;
  level: string;
  rows: string[];
  tags?: string[];
}

export interface StadiumSeating {
  venue: string;
  sections: StadiumSection[];
}

// Helper to generate row ranges
function numRows(start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
}

function letterRows(start: string, end: string): string[] {
  const rows: string[] = [];
  for (let c = start.charCodeAt(0); c <= end.charCodeAt(0); c++) {
    rows.push(String.fromCharCode(c));
  }
  return rows;
}

function sections(prefix: string, start: number, end: number, level: string, rows: string[], tags?: string[]): StadiumSection[] {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    id: `${prefix}${start + i}`,
    name: `Section ${prefix}${start + i}`,
    level,
    rows,
    tags,
  }));
}

function sectionsNoPrefix(start: number, end: number, level: string, rows: string[], tags?: string[]): StadiumSection[] {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    id: String(start + i),
    name: `Section ${start + i}`,
    level,
    rows,
    tags,
  }));
}

// ─── AL East ──────────────────────────────────────────────

const camdenYards: StadiumSeating = {
  venue: 'Oriole Park at Camden Yards',
  sections: [
    // Field Level - even-numbered infield sections (behind plate & baselines)
    ...sectionsNoPrefix(16, 58, 'Field Level', numRows(1, 20), ['Infield']),
    // Field Level - even-numbered outfield/corner sections
    ...sectionsNoPrefix(4, 14, 'Field Level', numRows(1, 18)),
    ...sectionsNoPrefix(60, 98, 'Field Level', numRows(1, 18)),
    // Lower Reserve - odd-numbered sections 1-87
    ...sectionsNoPrefix(1, 87, 'Lower Reserve', numRows(1, 22)),
    // Club Level - sections 204-288 (wraps ~half stadium)
    ...sectionsNoPrefix(204, 288, 'Club Level', numRows(1, 13)),
    // Upper Level - sections 306-388
    ...sectionsNoPrefix(306, 388, 'Upper Level', numRows(1, 25)),
    // Flight Deck (standing/bleacher area in left field)
    { id: 'FD', name: 'Flight Deck', level: 'Bleachers', rows: numRows(1, 10) },
  ],
};

const fenwayPark: StadiumSeating = {
  venue: 'Fenway Park',
  sections: [
    // Field Box - sections 9-16, 71-82, odd 17-69 (rows 1-2 then A-M)
    ...sectionsNoPrefix(9, 82, 'Field Box', numRows(1, 14), ['Field Level']),
    // Loge Box - sections 98-165 (rows AA-RR, ~18 rows)
    ...sectionsNoPrefix(98, 165, 'Loge Box', numRows(1, 18)),
    // Grandstand - sections 1-33 (rows 1-18)
    ...sectionsNoPrefix(1, 33, 'Grandstand', numRows(1, 18)).map(s => ({ ...s, id: `GS${s.id}`, name: `Grandstand ${s.id}` })),
    // Bleachers - sections 34-43 (rows 1-40)
    ...sectionsNoPrefix(34, 43, 'Bleachers', numRows(1, 40)),
    // Right Field Roof Box / Pavilion
    { id: 'RFRB', name: 'Right Field Roof Box', level: 'Right Field Roof', rows: numRows(1, 5) },
    { id: 'PVL', name: 'Pavilion Box', level: 'Pavilion', rows: numRows(1, 7) },
    { id: 'PVLR', name: 'Pavilion Reserved', level: 'Pavilion', rows: numRows(1, 7) },
  ],
};

const yankeeStadium: StadiumSeating = {
  venue: 'Yankee Stadium',
  sections: [
    // Legends Seats (premium, sections 11-29, behind home plate)
    ...sectionsNoPrefix(11, 29, 'Legends Level', numRows(1, 17), ['Premium']),
    // Field Level (100s) - infield sections 100-135
    ...sectionsNoPrefix(100, 135, 'Field Level', numRows(1, 23)),
    // Main Level (200s) - sections 205-234 infield + 202-204 & 235-238 bleachers
    ...sectionsNoPrefix(205, 234, 'Main Level', numRows(1, 41)),
    ...sectionsNoPrefix(202, 204, 'Main Level - Bleachers', numRows(1, 24)),
    ...sectionsNoPrefix(235, 238, 'Main Level - Bleachers', numRows(1, 24)),
    // Terrace Level (300s) - sections 301-329
    ...sectionsNoPrefix(301, 329, 'Terrace Level', numRows(1, 14)),
    // Grandstand (400s) - sections 405-432
    ...sectionsNoPrefix(405, 432, 'Grandstand', numRows(1, 14)),
  ],
};

const tropicanaField: StadiumSeating = {
  venue: 'Tropicana Field',
  sections: [
    // Lower Level (100s) - center 101-118, corners 128-150 & 139-145, ends 119-127
    ...sectionsNoPrefix(101, 150, 'Lower Level', numRows(1, 30)),
    // 200 Level - center 203-208, corners 213-224, ends 209-212
    ...sectionsNoPrefix(203, 224, 'Club Level', numRows(1, 8)),
    // 300 Level - sections 300-324
    ...sectionsNoPrefix(300, 324, 'Upper Level', numRows(1, 26)),
    // Standing Room
    { id: 'SRO', name: 'Standing Room Only', level: 'Standing Room', rows: ['SRO'] },
  ],
};

const rogersCentre: StadiumSeating = {
  venue: 'Rogers Centre',
  sections: [
    // 100 Level - Field Level infield 108-141, outfield 101-107 & 142-148
    ...sectionsNoPrefix(101, 148, 'Field Level', numRows(1, 30)),
    // Premium field sections 1-5, 16-19, 21-26, 29-32
    ...sectionsNoPrefix(1, 32, 'Field Level - Premium', numRows(1, 15), ['Premium']),
    // 200 Level - sections 204-244 (infield 220-228, corners 218-219 & 229-230, ends 204-211 & 237-244)
    ...sectionsNoPrefix(204, 244, 'Club Level', numRows(1, 12)),
    // 500 Level - sections 504-544 (center 521-527, corners 515-519 & 528-533, ends 504-514 & 534-544)
    ...sectionsNoPrefix(504, 544, 'Upper Deck', numRows(1, 14)),
  ],
};

// ─── AL Central ──────────────────────────────────────────

const guaranteedRateField: StadiumSeating = {
  venue: 'Guaranteed Rate Field',
  sections: [
    // Lower Level (100s) - center 125-139, ends 116-124 & 140-146, corners 101-115 & 147-163
    ...sectionsNoPrefix(100, 163, 'Lower Level', numRows(1, 37)),
    // Club Level (300s) - sections 311-357 (5 rows each)
    ...sectionsNoPrefix(311, 357, 'Club Level', numRows(1, 5)),
    // Upper Level (500s) - sections 506-558 (21 rows each)
    ...sectionsNoPrefix(506, 558, 'Upper Level', numRows(1, 21)),
  ],
};

const progressiveField: StadiumSeating = {
  venue: 'Progressive Field',
  sections: [
    // Lower Level (100s) - infield 101-112, baselines 113-126, corners & outfield through 179
    ...sectionsNoPrefix(101, 179, 'Lower Level', numRows(1, 30)),
    // Bleachers - sections 180-185 (left field)
    ...sectionsNoPrefix(180, 185, 'Bleachers', numRows(1, 20)),
    // 400 Level - infield, baselines, outfield (5 rows deep)
    ...sectionsNoPrefix(401, 475, 'Upper Box', numRows(1, 5)),
    // 500 Level - sections 501-575 (up to 22 rows deep)
    ...sectionsNoPrefix(501, 575, 'Upper Level', numRows(1, 22)),
  ],
};

const comericaPark: StadiumSeating = {
  venue: 'Comerica Park',
  sections: [
    // Lower Level (100s) - center 123-132, ends 116-122 & 133-139, corners 101-114 & 140-150
    ...sectionsNoPrefix(101, 150, 'Lower Level', numRows(1, 35)),
    // Tiger Den / Club (200s) - sections 211-219
    ...sectionsNoPrefix(211, 219, 'Club Level', numRows(1, 22)),
    // Upper Level (300s) - center 325-331, corners 334-345, ends 322-324 & 332-333
    ...sectionsNoPrefix(322, 345, 'Upper Level', numRows(1, 22)),
  ],
};

const kauffmanStadium: StadiumSeating = {
  venue: 'Kauffman Stadium',
  sections: [
    // Lower Level (100s) - center 121-133, ends 115-120 & 134-140, corners 101-107 & 148-152
    ...sectionsNoPrefix(101, 152, 'Lower Level', numRows(1, 24)),
    // 200 Level - center 221-234, ends 201-208 & 241-252, corners 209-214
    ...sectionsNoPrefix(201, 252, 'Plaza Level', numRows(1, 20)),
    // 300 Level (Loge) - sections 301-325
    ...sectionsNoPrefix(301, 325, 'Loge Level', numRows(1, 10)),
    // 400 Level (View) - sections 401-439
    ...sectionsNoPrefix(401, 439, 'View Level', numRows(1, 22)),
  ],
};

const targetField: StadiumSeating = {
  venue: 'Target Field',
  sections: [
    // Field Level - premium field sections 1-10
    ...sectionsNoPrefix(1, 10, 'Field Level', numRows(1, 15), ['Premium']),
    // 100 Level - center 110-117, ends 104-109 & 118-122, corners 101-103 & 123-130
    ...sectionsNoPrefix(101, 130, 'Lower Level', numRows(1, 28)),
    // Legends Club / Balcony - sections 136-140 (between 100s and 200s)
    ...sectionsNoPrefix(136, 140, 'Legends Club', numRows(1, 12), ['Premium']),
    // 200 Level - center 210-218, ends 206-209 & 219-223, corners 201-204 & 224-228
    ...sectionsNoPrefix(201, 228, 'Suite Level', numRows(1, 8)),
    // 300 Level - center 309-319, corners 301-308 & 320-327
    ...sectionsNoPrefix(301, 327, 'Upper Level', numRows(1, 14)),
  ],
};

// ─── AL West ─────────────────────────────────────────────

const minuteMaidPark: StadiumSeating = {
  venue: 'Minute Maid Park',
  sections: [
    // Diamond Club - sections AA, A-F (behind home plate, premium)
    { id: 'AA', name: 'Diamond Club AA', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    { id: 'A', name: 'Diamond Club A', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    { id: 'B', name: 'Diamond Club B', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    { id: 'C', name: 'Diamond Club C', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    { id: 'D', name: 'Diamond Club D', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    { id: 'E', name: 'Diamond Club E', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    { id: 'F', name: 'Diamond Club F', level: 'Diamond Club', rows: numRows(1, 9), tags: ['Premium'] },
    // Field Level (100s) - left field 105-116, behind plate 118-120, right field 122-134, outfield 100-104 & 150-156
    ...sectionsNoPrefix(100, 156, 'Field Level', numRows(1, 40)),
    // Insperity Club - sections 70-75 (back of lower level behind plate)
    ...sectionsNoPrefix(70, 75, 'Insperity Club', numRows(1, 12), ['Premium']),
    // Club Level (200s) - sections 205-258 (infield 206-236, outfield 251-258)
    ...sectionsNoPrefix(205, 258, 'Club Level', numRows(1, 17)),
    // Mezzanine Level (300s) - sections 305-338
    ...sectionsNoPrefix(305, 338, 'Mezzanine Level', numRows(1, 9)),
    // Upper Level (400s) - sections 405-438
    ...sectionsNoPrefix(405, 438, 'Upper Deck', numRows(1, 25)),
  ],
};

const angelStadium: StadiumSeating = {
  venue: 'Angel Stadium',
  sections: [
    // Field Level (100s) - center 109-127, corners 101-108 & 128-135
    ...sectionsNoPrefix(101, 135, 'Field Level', letterRows('A', 'Z')),
    // Club/Terrace Level (200s) - center 212-222, corners 202-211 & 223-240
    ...sectionsNoPrefix(202, 240, 'Club Level', letterRows('A', 'K')),
    // 400 Level - center 413-424, corners 401-408 & 429-436, ends 409-412 & 425-428
    ...sectionsNoPrefix(401, 436, 'Terrace Level', letterRows('A', 'J')),
    // 500 Level (Upper View) - center 515-526, ends 501-514 & 527-540
    ...sectionsNoPrefix(501, 540, 'View Level', letterRows('A', 'R')),
  ],
};

const sutterHealthPark: StadiumSeating = {
  venue: 'Sutter Health Park',
  sections: [
    // Field Level (100s) - sections 101-125 wrap around field
    ...sectionsNoPrefix(101, 125, 'Field Level', numRows(1, 25)),
    // Club Level (200s) - sections 201-206 (Solon Club, right field)
    ...sectionsNoPrefix(201, 206, 'Club Level', numRows(1, 10), ['Premium']),
    // Dugout Club (behind plate, sections 108-116)
    { id: 'DC', name: 'Dugout Club', level: 'Dugout Club', rows: numRows(1, 5), tags: ['Premium'] },
  ],
};

const tMobilePark: StadiumSeating = {
  venue: 'T-Mobile Park',
  sections: [
    // Main Level (100s) - center 123-137, ends 102-115 & 146-151, corners 116-122 & 138-144
    ...sectionsNoPrefix(102, 151, 'Main Level', numRows(1, 42)),
    // Club Level (200s) - center 224-236, corners 222-223 & 237-238, ends 211-221 & 239-249
    ...sectionsNoPrefix(211, 249, 'Club Level', numRows(1, 12)),
    // Upper Level (300s) - center 320-340, corners 306-319 & 341-347
    ...sectionsNoPrefix(306, 347, 'Upper Level', numRows(1, 29)),
    // Bleachers (above left field and below center field scoreboard)
    { id: 'LFB', name: 'Left Field Bleachers', level: 'Bleachers', rows: numRows(1, 20) },
    { id: 'CFB', name: 'Center Field Bleachers', level: 'Bleachers', rows: numRows(1, 20) },
  ],
};

const globeLifeField: StadiumSeating = {
  venue: 'Globe Life Field',
  sections: [
    // Field Level - sections 1-25 (single/double digit, 16 rows typical)
    ...sectionsNoPrefix(1, 25, 'Field Level', numRows(1, 20), ['Field Level']),
    // Sky Boxes - SB1-SB4 (left field foul territory)
    { id: 'SB1', name: 'Sky Box 1', level: 'Sky Box', rows: numRows(1, 3), tags: ['Premium'] },
    { id: 'SB2', name: 'Sky Box 2', level: 'Sky Box', rows: numRows(1, 3), tags: ['Premium'] },
    { id: 'SB3', name: 'Sky Box 3', level: 'Sky Box', rows: numRows(1, 3), tags: ['Premium'] },
    { id: 'SB4', name: 'Sky Box 4', level: 'Sky Box', rows: numRows(1, 3), tags: ['Premium'] },
    // Mezzanine Level (100s) - center 112-115, ends 107-111 & 116-120, corners 101-106 & 121-134
    ...sectionsNoPrefix(101, 134, 'Mezzanine Level', numRows(1, 20)),
    // Pavilion Level (200s) - center 212-222, corners 201-211 & 223-244
    ...sectionsNoPrefix(201, 244, 'Pavilion Level', numRows(1, 10)),
    // Upper Level (300s) - center 310-314, corners 301-309 & 316-326
    ...sectionsNoPrefix(301, 326, 'Upper Level', numRows(1, 15)),
  ],
};

// ─── NL East ─────────────────────────────────────────────

const truistPark: StadiumSeating = {
  venue: 'Truist Park',
  sections: [
    // Dugout Level (premium sections 1-9, 4-5 rows each)
    ...sectionsNoPrefix(1, 9, 'Dugout Level', numRows(1, 5), ['Premium']),
    // Infield Field Level (sections 10-42, ~15 seats per row)
    ...sectionsNoPrefix(10, 42, 'Field Level', numRows(1, 15)),
    // Lower Level (sections 107-160)
    ...sectionsNoPrefix(107, 160, 'Field Level', numRows(1, 30)),
    // Terrace Level (sections 210-246, rows 1-19)
    ...sectionsNoPrefix(210, 246, 'Terrace Level', numRows(1, 19)),
    // Vista Level (sections 312-347, rows 1-13)
    ...sectionsNoPrefix(312, 347, 'Vista Level', numRows(1, 13)),
    // Grandstand Level (sections 410-431, rows 1-12)
    ...sectionsNoPrefix(410, 431, 'Grandstand Level', numRows(1, 12)),
  ],
};

const loanDepotPark: StadiumSeating = {
  venue: 'loanDepot Park',
  sections: [
    // Field Level / Promenade (sections 1-39, rows 1-30)
    ...sectionsNoPrefix(1, 39, 'Field Level', numRows(1, 30)),
    // Additional Field Level outfield sections (134-141)
    ...sectionsNoPrefix(134, 141, 'Field Level - Outfield', numRows(1, 20)),
    // Legends Level (sections 201-228, rows 1-15)
    ...sectionsNoPrefix(201, 228, 'Legends Level', numRows(1, 15)),
    // Vista Level (sections 302-327, rows 1-18)
    ...sectionsNoPrefix(302, 327, 'Vista Level', numRows(1, 18)),
  ],
};

const citiField: StadiumSeating = {
  venue: 'Citi Field',
  sections: [
    // Delta Sky360 Club (sections 11-19, rows 1-20)
    ...sectionsNoPrefix(11, 19, 'Delta Sky360 Club', numRows(1, 20), ['Premium']),
    // Field Level - end sections (106-114, rows 1-31)
    ...sectionsNoPrefix(106, 114, 'Field Level', numRows(1, 31)),
    // Field Level - corner/outfield sections (120-143, rows 1-33)
    ...sectionsNoPrefix(120, 143, 'Field Level', numRows(1, 33)),
    // Excelsior Level - corner (308-311, rows 1-12)
    ...sectionsNoPrefix(308, 311, 'Excelsior Level', numRows(1, 12)),
    // Excelsior Level - center/end (312-331, rows 1-7)
    ...sectionsNoPrefix(312, 331, 'Excelsior Level', numRows(1, 7)),
    // Promenade - Mezzanine (401-437, rows 1-8)
    ...sectionsNoPrefix(401, 437, 'Promenade Level', numRows(1, 8)),
    // Upper Level (501-538, rows 1-17)
    ...sectionsNoPrefix(501, 538, 'Upper Level', numRows(1, 17)),
  ],
};

const citizensBankPark: StadiumSeating = {
  venue: 'Citizens Bank Park',
  sections: [
    // Diamond Club (sections A-G, rows 1-19)
    { id: 'A', name: 'Diamond Club A', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    { id: 'B', name: 'Diamond Club B', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    { id: 'C', name: 'Diamond Club C', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    { id: 'D', name: 'Diamond Club D', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    { id: 'E', name: 'Diamond Club E', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    { id: 'F', name: 'Diamond Club F', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    { id: 'G', name: 'Diamond Club G', level: 'Diamond Club', rows: numRows(1, 19), tags: ['Premium'] },
    // Field Level (sections 101-145, rows 1-36)
    ...sectionsNoPrefix(101, 145, 'Field Level', numRows(1, 36)),
    // Hall of Fame Club (sections 206-237, rows 1-10)
    ...sectionsNoPrefix(206, 237, 'Hall of Fame Club', numRows(1, 10)),
    // Terrace Level - center (318-323, rows 1-10)
    ...sectionsNoPrefix(301, 333, 'Terrace Level', numRows(1, 21)),
    // Upper Level (sections 412-434, rows 1-16)
    ...sectionsNoPrefix(412, 434, 'Upper Level', numRows(1, 16)),
  ],
};

const nationalsPark: StadiumSeating = {
  venue: 'Nationals Park',
  sections: [
    // Lower Level (sections 100-143, rows A-Z + AA-WW)
    ...sectionsNoPrefix(100, 143, 'Field Level', letterRows('A', 'Z')),
    // Club Level - center (sections 206-221, Delta Sky360)
    ...sectionsNoPrefix(201, 243, 'Club Level', numRows(1, 8)),
    // Gallery Level (sections 301-321, rows 1-10)
    ...sectionsNoPrefix(301, 321, 'Gallery Level', numRows(1, 10)),
    // Upper Level (sections 401-409, 416-420, rows A-N)
    ...sectionsNoPrefix(401, 409, 'Upper Level', letterRows('A', 'N')),
    ...sectionsNoPrefix(416, 420, 'Upper Level', letterRows('A', 'N')),
  ],
};

// ─── NL Central ──────────────────────────────────────────

const wrigleyField: StadiumSeating = {
  venue: 'Wrigley Field',
  sections: [
    // Field Box (sections 4-38, rows 1-15)
    ...sectionsNoPrefix(4, 38, 'Field Box', numRows(1, 15), ['Field Level']),
    // 100 Level / Terrace (sections 101-142, rows 1-15)
    ...sectionsNoPrefix(101, 142, 'Terrace Level', numRows(1, 15)),
    // 200 Level / Upper Terrace (sections 205-237, rows 1-23)
    ...sectionsNoPrefix(205, 237, 'Upper Terrace', numRows(1, 23)),
    // 300 Level / Upper Deck Box (sections 301-318, rows 1-12)
    ...sectionsNoPrefix(301, 318, 'Upper Deck Box', numRows(1, 12)),
    // 400 Level / Upper Deck Reserved (sections 409-431, rows 1-9)
    ...sectionsNoPrefix(409, 431, 'Upper Deck Reserved', numRows(1, 9)),
    // 500 Level / Bleachers (sections 503-538, rows 1-9)
    ...sectionsNoPrefix(503, 538, 'Bleachers', numRows(1, 9)),
  ],
};

const greatAmericanBallPark: StadiumSeating = {
  venue: 'Great American Ball Park',
  sections: [
    // Diamond Seats (sections 1-5, rows A-I)
    ...sectionsNoPrefix(1, 5, 'Diamond Seats', letterRows('A', 'I'), ['Premium']),
    // Sun/Moon Deck premium (sections 22-25)
    ...sectionsNoPrefix(22, 25, 'Sun/Moon Deck', numRows(1, 10), ['Premium']),
    // Lower Level (sections 101-146, rows A-Z + AA-KK)
    ...sectionsNoPrefix(101, 146, 'Lower Level', letterRows('A', 'Z')),
    // Club Level (sections 220-228, rows 1-8)
    ...sectionsNoPrefix(220, 228, 'Club Level', numRows(1, 8)),
    // Fox Sports Ohio Club (sections 301-307, rows 1-6)
    ...sectionsNoPrefix(301, 307, 'Champions Club', numRows(1, 6)),
    // View Level (sections 401-437, rows 1-18; gap at 407)
    ...sectionsNoPrefix(401, 406, 'View Level', numRows(1, 18)),
    ...sectionsNoPrefix(408, 437, 'View Level', numRows(1, 18)),
    // Upper Level (sections 509-537, rows 1-15)
    ...sectionsNoPrefix(509, 537, 'Upper Level', numRows(1, 15)),
  ],
};

const americanFamilyField: StadiumSeating = {
  venue: 'American Family Field',
  sections: [
    // Field Level (sections 101-131, rows 1-30)
    ...sectionsNoPrefix(101, 131, 'Field Level', numRows(1, 30)),
    // Loge Level (sections 206-228, rows 1-15)
    ...sectionsNoPrefix(206, 228, 'Loge Level', numRows(1, 15)),
    // Club Level (sections 306-345, rows 1-8)
    ...sectionsNoPrefix(306, 345, 'Club Level', numRows(1, 8)),
    // Terrace Level (sections 404-442, rows 1-14)
    ...sectionsNoPrefix(404, 442, 'Terrace Level', numRows(1, 14)),
  ],
};

const pncPark: StadiumSeating = {
  venue: 'PNC Park',
  sections: [
    // Premium Field sections (1-32, rows A-M)
    ...sectionsNoPrefix(1, 32, 'Field Level', letterRows('A', 'M')),
    // Lower Level (sections 101-147, rows A-Z + AA-HH)
    ...sectionsNoPrefix(101, 147, 'Lower Level', letterRows('A', 'Z')),
    // Pittsburgh Baseball Club (sections 207-228, rows A-K)
    ...sectionsNoPrefix(207, 228, 'Club Level', letterRows('A', 'K')),
    // Grandstand / Upper Level (sections 301-333, rows A-Y)
    ...sectionsNoPrefix(301, 333, 'Upper Level', letterRows('A', 'Y')),
  ],
};

const buschStadium: StadiumSeating = {
  venue: 'Busch Stadium',
  sections: [
    // Cardinals Club (sections 1-8, behind home plate)
    ...sectionsNoPrefix(1, 8, 'Cardinals Club', numRows(1, 14), ['Premium']),
    // Field Level / Baseline (sections 101-197, rows 1-25; includes bleachers 101-111, 189-197)
    ...sectionsNoPrefix(101, 197, 'Field Level', numRows(1, 25)),
    // Redbird Club (sections 227-272, rows 1-16)
    ...sectionsNoPrefix(227, 272, 'Redbird Club', numRows(1, 16)),
    // Pavilion Level (sections 328-372, rows 1-20)
    ...sectionsNoPrefix(328, 372, 'Pavilion Level', numRows(1, 20)),
    // Terrace Level (sections 428-454, rows 1-20)
    ...sectionsNoPrefix(428, 454, 'Terrace Level', numRows(1, 20)),
  ],
};

// ─── NL West ─────────────────────────────────────────────

const chaseField: StadiumSeating = {
  venue: 'Chase Field',
  sections: [
    // Lower Level (sections 101-143, rows 1-40)
    ...sectionsNoPrefix(101, 143, 'Lower Level', numRows(1, 40)),
    // Club Level (sections 200-223, rows 1-11)
    ...sectionsNoPrefix(200, 223, 'Club Level', numRows(1, 11)),
    // Upper Deck (sections 300-331, rows 1-40)
    ...sectionsNoPrefix(300, 331, 'Upper Deck', numRows(1, 40)),
  ],
};

const coorsField: StadiumSeating = {
  venue: 'Coors Field',
  sections: [
    // Field Level (sections 105-160, rows 1-39)
    ...sectionsNoPrefix(105, 160, 'Field Level', numRows(1, 39)),
    // Club Level (sections 214-247, rows 1-13)
    ...sectionsNoPrefix(214, 247, 'Club Level', numRows(1, 13)),
    // Upper Level (sections 301-347, rows 1-25)
    ...sectionsNoPrefix(301, 347, 'Upper Level', numRows(1, 25)),
    // Rockpile (sections 401-403, bleacher seating)
    ...sectionsNoPrefix(401, 403, 'Rockpile', numRows(1, 20)),
  ],
};

const dodgerStadium: StadiumSeating = {
  venue: 'Dodger Stadium',
  sections: [
    ...sectionsNoPrefix(1, 60, 'Field Level', numRows(1, 30), ['Field Level']),
    ...sectionsNoPrefix(101, 170, 'Loge Level', numRows(1, 12)),
    ...sectionsNoPrefix(201, 260, 'Club Level', numRows(1, 8)),
    ...sectionsNoPrefix(301, 315, 'Reserve Level', numRows(1, 25)),
    ...sectionsNoPrefix(1, 60, 'Top Deck', numRows(1, 20)).map(s => ({
      ...s,
      id: `TD${s.id}`,
      name: `Top Deck ${s.id.replace('TD', '')}`,
      level: 'Top Deck',
    })),
  ],
};

const petcoPark: StadiumSeating = {
  venue: 'Petco Park',
  sections: [
    ...sectionsNoPrefix(101, 132, 'Field Level', numRows(1, 30), ['Field Level']),
    ...sectionsNoPrefix(200, 230, 'Toyota Terrace', numRows(1, 8), ['Club Access']),
    ...sectionsNoPrefix(301, 332, 'Upper Level', numRows(1, 20)),
    { id: 'LFB', name: 'Left Field Bleachers', level: 'Bleachers', rows: numRows(1, 10) },
    { id: 'RFB', name: 'Right Field Bleachers', level: 'Bleachers', rows: numRows(1, 10) },
    { id: 'PH', name: 'Park in the Park', level: 'General Admission', rows: ['GA'] },
  ],
};

const oraclePark: StadiumSeating = {
  venue: 'Oracle Park',
  sections: [
    ...sectionsNoPrefix(101, 152, 'Lower Box', numRows(1, 30)),
    ...sectionsNoPrefix(201, 235, 'Club Level', numRows(1, 8)),
    ...sectionsNoPrefix(301, 335, 'View Level', numRows(1, 16)),
    { id: 'BL130', name: 'Bleachers 130', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL131', name: 'Bleachers 131', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL136', name: 'Bleachers 136', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL137', name: 'Bleachers 137', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL138', name: 'Bleachers 138', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL139', name: 'Bleachers 139', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL140', name: 'Bleachers 140', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL141', name: 'Bleachers 141', level: 'Bleachers', rows: numRows(1, 50) },
    { id: 'BL142', name: 'Bleachers 142', level: 'Bleachers', rows: numRows(1, 50) },
  ],
};

// ─── Export map keyed by team abbreviation ────────────────

export const STADIUM_SEATING: Record<string, StadiumSeating> = {
  // AL East
  BAL: camdenYards,
  BOS: fenwayPark,
  NYY: yankeeStadium,
  TB: tropicanaField,
  TOR: rogersCentre,
  // AL Central
  CWS: guaranteedRateField,
  CLE: progressiveField,
  DET: comericaPark,
  KC: kauffmanStadium,
  MIN: targetField,
  // AL West
  HOU: minuteMaidPark,
  LAA: angelStadium,
  OAK: sutterHealthPark,
  SEA: tMobilePark,
  TEX: globeLifeField,
  // NL East
  ATL: truistPark,
  MIA: loanDepotPark,
  NYM: citiField,
  PHI: citizensBankPark,
  WSH: nationalsPark,
  // NL Central
  CHC: wrigleyField,
  CIN: greatAmericanBallPark,
  MIL: americanFamilyField,
  PIT: pncPark,
  STL: buschStadium,
  // NL West
  AZ: chaseField,
  COL: coorsField,
  LAD: dodgerStadium,
  SD: petcoPark,
  SF: oraclePark,
};
