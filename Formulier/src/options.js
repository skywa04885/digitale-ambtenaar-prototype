export const optionSets = {
  municipality: [
    'Arnhem',
    'Nijmegen',
    'Ede',
    'Wageningen',
    'Apeldoorn',
    'Doetinchem',
    'Zutphen',
    'Tiel',
    'Wijchen',
    'Overbetuwe'
  ],
  currentHousing: [
    'Zelfstandige huurwoning',
    'Koopwoning',
    'Inwonend bij familie',
    'Tijdelijke opvang',
    'Bankhoppen',
    'Dakloos',
    'Beschermd wonen',
    'Studentenkamer',
    'Onveilige woonsituatie'
  ],
  householdType: [
    'Alleenstaand',
    'Alleenstaande ouder',
    'Paar zonder kinderen',
    'Paar met kinderen',
    'Meerpersoonshuishouden',
    'Mantelzorgsituatie'
  ],
  careNeed: [
    'Geen',
    'Lichte ondersteuning',
    'Wmo-ondersteuning',
    'Mantelzorg nabij nodig',
    'Rolstoeltoegankelijk nodig',
    'Gelijkvloers noodzakelijk',
    'Intensieve zorgvraag'
  ],
  preferredHousing: [
    'Sociale huurwoning',
    'Gelijkvloerse woning',
    'Seniorenwoning',
    'Gezinswoning',
    'Beschermd wonen',
    'Woonzorgconcept',
    'Gemengd wonen',
    'Tiny house of compacte woning'
  ],
  supportNetwork: [
    'Sterk netwerk in de buurt',
    'Mantelzorg in dezelfde gemeente',
    'Beperkt netwerk',
    'Geen lokaal netwerk',
    'Wil bijdragen aan wooncommunity',
    'Heeft rustige woonomgeving nodig'
  ],
  moveWillingness: [
    'Direct bereid',
    'Bereid bij passend aanbod',
    'Twijfelt',
    'Niet bereid',
    'Onbekend'
  ]
};

export function getSuggestions(field, query = '') {
  const options = optionSets[field] || [];
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return options.slice(0, 8);
  }

  return options
    .filter((option) => option.toLowerCase().includes(normalized))
    .slice(0, 8);
}
