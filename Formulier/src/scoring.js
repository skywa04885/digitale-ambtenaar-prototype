const YES_VALUES = new Set(['ja', 'yes', 'true', true]);

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isYes(value) {
  return YES_VALUES.has(String(value).toLowerCase()) || YES_VALUES.has(value);
}

function includesAny(value, words) {
  const text = String(value || '').toLowerCase();
  return words.some((word) => text.includes(word));
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(max, number));
}

function addBreakdown(items, label, points, reason) {
  if (points > 0) {
    items.push({ label, points, reason });
  }
}

function riskLevel(score) {
  if (score >= 80) return 'Kritiek';
  if (score >= 60) return 'Hoog';
  if (score >= 35) return 'Midden';
  return 'Laag';
}

function areaLevel(score) {
  if (score >= 24) return 'Hoog';
  if (score >= 12) return 'Midden';
  return 'Laag';
}

export function calculateAssessment(profile) {
  const income = toNumber(profile.monthlyIncome);
  const rent = toNumber(profile.monthlyRent);
  const householdSize = Math.max(1, toNumber(profile.householdSize));
  const rooms = Math.max(0, toNumber(profile.currentRooms));
  const rentRatio = income > 0 && rent > 0 ? rent / income : 0;
  const breakdown = [];

  let housingRisk = 0;
  if (isYes(profile.homelessRisk)) housingRisk += 30;
  if (isYes(profile.evictionNotice)) housingRisk += 24;
  if (includesAny(profile.currentHousing, ['dakloos', 'opvang', 'bankhoppen'])) housingRisk += 24;
  if (includesAny(profile.currentHousing, ['onveilig'])) housingRisk += 18;
  addBreakdown(breakdown, 'Woonzekerheid', housingRisk, 'Dreigende of actuele wooncrisis.');

  let affordabilityRisk = 0;
  if (rentRatio >= 0.55) affordabilityRisk += 18;
  else if (rentRatio >= 0.4) affordabilityRisk += 12;
  if (income > 0 && income < 1400) affordabilityRisk += 8;
  if (isYes(profile.rentArrears)) affordabilityRisk += 12;
  addBreakdown(breakdown, 'Betaalbaarheid', affordabilityRisk, 'Inkomen, woonlasten en achterstanden.');

  let careRisk = 0;
  if (isYes(profile.medicalUrgency)) careRisk += 18;
  if (isYes(profile.accessibilityNeed)) careRisk += 12;
  if (includesAny(profile.careNeed, ['rolstoel', 'gelijkvloers', 'intensieve'])) careRisk += 16;
  else if (includesAny(profile.careNeed, ['wmo', 'mantelzorg', 'ondersteuning'])) careRisk += 9;
  addBreakdown(breakdown, 'Zorg en toegankelijkheid', careRisk, 'Zorgbehoefte en geschiktheid van de woning.');

  let householdRisk = 0;
  if (householdSize >= 4 && rooms > 0 && rooms < 3) householdRisk += 10;
  if (includesAny(profile.householdType, ['ouder', 'kinderen']) && includesAny(profile.currentHousing, ['kamer', 'inwonend'])) {
    householdRisk += 10;
  }
  if (isYes(profile.safetyIssue)) householdRisk += 18;
  addBreakdown(breakdown, 'Gezin en veiligheid', householdRisk, 'Passendheid, overbewoning en veiligheid.');

  let futureRisk = 0;
  if (includesAny(profile.supportNetwork, ['geen lokaal', 'beperkt'])) futureRisk += 7;
  if (includesAny(profile.moveWillingness, ['niet bereid']) && isYes(profile.underutilizedHome)) futureRisk += 6;
  addBreakdown(breakdown, 'Toekomstig risico', futureRisk, 'Netwerk, doorstroming en voorspelbare knelpunten.');

  const urgencyScore = clamp(
    Math.round(housingRisk + affordabilityRisk + careRisk + householdRisk + futureRisk),
    0,
    100
  );

  const doorstromingScore = clamp(
    (isYes(profile.underutilizedHome) ? 45 : 0) +
      (includesAny(profile.moveWillingness, ['direct', 'passend']) ? 35 : 0) +
      (includesAny(profile.preferredHousing, ['compacte', 'senioren', 'gelijkvloerse']) ? 10 : 0),
    0,
    100
  );

  const riskAreas = [
    {
      name: 'Woonzekerheid',
      level: areaLevel(housingRisk),
      text: housingRisk >= 24 ? 'Directe aandacht nodig.' : 'Geen acute wooncrisis op basis van huidige invoer.'
    },
    {
      name: 'Betaalbaarheid',
      level: areaLevel(affordabilityRisk),
      text: rentRatio > 0 ? `Woonlasten zijn ${Math.round(rentRatio * 100)}% van het inkomen.` : 'Nog onvoldoende financiele gegevens.'
    },
    {
      name: 'Zorg en toegankelijkheid',
      level: areaLevel(careRisk),
      text: careRisk >= 12 ? 'Woning moet aansluiten op zorg- of toegankelijkheidsbehoefte.' : 'Geen zware zorgsignalen ingevuld.'
    },
    {
      name: 'Gezin en veiligheid',
      level: areaLevel(householdRisk),
      text: householdRisk >= 12 ? 'Gezinssituatie of veiligheid verhoogt urgentie.' : 'Geen zwaar passendheidsrisico ingevuld.'
    }
  ];

  const flags = [];
  if (urgencyScore >= 80) flags.push('Crisisroute beoordelen');
  if (isYes(profile.evictionNotice)) flags.push('Uitzetting of huuropzegging controleren');
  if (isYes(profile.safetyIssue)) flags.push('Veiligheidssituatie laten beoordelen');
  if (careRisk >= 18) flags.push('Zorg- of Wmo-route koppelen');
  if (doorstromingScore >= 60) flags.push('Doorstroomaanbod kansrijk');
  if (rentRatio >= 0.4) flags.push('Betaalbaarheidscheck nodig');

  return {
    urgencyScore,
    riskLevel: riskLevel(urgencyScore),
    doorstromingScore,
    rentRatio: rentRatio > 0 ? Number(rentRatio.toFixed(2)) : null,
    riskAreas,
    flags,
    breakdown
  };
}

export function buildDerivedProfile(profile, assessment = calculateAssessment(profile)) {
  const householdSize = Math.max(1, toNumber(profile.householdSize));
  const preferred = profile.preferredHousing || (householdSize > 2 ? 'Gezinswoning' : 'Sociale huurwoning');
  const care = profile.careNeed && profile.careNeed !== 'Geen' ? profile.careNeed : 'Geen specifieke zorgvraag ingevuld';
  const affordability =
    assessment.rentRatio === null
      ? 'Onvoldoende gegevens'
      : assessment.rentRatio >= 0.4
        ? 'Kwetsbaar'
        : 'Voorlopig passend';

  const movePotential =
    assessment.doorstromingScore >= 70
      ? 'Hoog'
      : assessment.doorstromingScore >= 35
        ? 'Midden'
        : 'Laag';

  return {
    woonbehoefte: preferred,
    betaalbaarheid: affordability,
    zorgbehoefte: care,
    verhuispotentie: movePotential,
    leefbaarheid: profile.supportNetwork || 'Onbekend',
    kernadvies:
      assessment.urgencyScore >= 80
        ? 'Beoordeel direct op crisis- of urgentieroute.'
        : assessment.urgencyScore >= 60
          ? 'Versnelde beoordeling en passende match onderzoeken.'
          : assessment.doorstromingScore >= 60
            ? 'Doorstroomaanbod onderzoeken.'
            : 'Reguliere match en herbeoordeling plannen.'
  };
}
