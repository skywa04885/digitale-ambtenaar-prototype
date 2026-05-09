# Gebruikershandleiding: Digitale Ambtenaar Prototype

## Overzicht
Dit prototype is een webapplicatie die verblijfsobjecten (panden) in Arnhem visualiseert op een interactieve kaart. De applicatie haalt data op van de openbare BAG (Basisregistratie Adressen en Gebouwen) API via PDOK (Publieke Dienstverlening Op de Kaart) en toont deze informatie op een gebruiksvriendelijke manier.

## Gebruikte Technologieën
- **Frontend Framework**: React 19 met TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS met ShadCN UI componenten
- **Kaartbibliotheek**: MapLibre GL (open-source alternatief voor Mapbox GL)
- **API**: PDOK BAG API (https://api.pdok.nl/kadaster/bag/ogc/v2/)

## Hoe te gebruiken

### 1. Toegang tot de applicatie
De applicatie is publiek beschikbaar op: https://skywa04885.github.io/digitale-ambtenaar-prototype/

Open deze URL in je browser om direct te beginnen met het verkennen van de verblijfsobjecten in Arnhem. Geen installatie of setup vereist.

### 2. Interface overzicht
De applicatie bestaat uit drie hoofddelen:

- **Header**: Functiefilter voor panden (alle, winkelfunctie, kantoorfunctie, woonfunctie)
- **Kaartweergave**: Interactieve kaart met panden als gekleurde punten
- **Zijbalk**: Filters, statistieken, legenda en resultatenlijst

### 3. Filters toepassen

- **Functiefilter** (bovenin): Selecteer het type gebruiksdoel

  - Alle: Toont alle panden
  - Winkelfunctie: Alleen winkelpanden
  - Kantoorfunctie: Alleen kantoorruimtes
  - Woonfunctie: Alleen woonpanden

- **Statusfilter** (in zijbalk): Filter op status van het pand

  - Vacant: Leegstaande panden
  - Niet in gebruik: Panden buiten gebruik
  - In gebruik: Actief gebruikte panden
  - Onbekend: Status niet bepaald

- **Zoekfunctie** (in zijbalk): Typ een adres om te zoeken

### 4. Kaart interactie

- **Zoom in/uit**: Gebruik muiswiel of zoomknoppen
- **Pannen**: Klik en sleep om de kaart te verplaatsen
- **Pand selecteren**: Klik op een gekleurd punt om details te zien
- **Geselecteerd pand**: Verschijnt in de resultatenlijst met extra informatie

### 5. Informatie bekijken

- **Statistieken**: Toont aantal panden per categorie in de zijbalk
- **Legenda**: Kleurcodes voor verschillende statussen:
  - **Mogelijk leegstaand** (rood): Panden die mogelijk leegstaan (voorbeeld: 6.578 panden)
  - **Niet in gebruik** (paars): Panden die buiten gebruik zijn (voorbeeld: 4 panden)
  - **In gebruik** (groen): Actief gebruikte panden (voorbeeld: 90.143 panden)
  - **Onbekend** (grijs): Status niet bepaald (voorbeeld: 275 panden)
- **Resultatenlijst**: Scrollbare lijst met alle gefilterde panden
- **Pand details**: Adres, postcode, woonplaats, status, gebruiksdoel, oppervlakte, bouwjaar

## Data bron

De applicatie gebruikt de **PDOK BAG API** om verblijfsobjecten op te halen voor het gebied van Arnhem. De API levert:

- Geografische coördinaten (latitude/longitude)
- Adresgegevens
- Status informatie
- Gebruiksdoel
- Oppervlakte en bouwjaar

**Belangrijk**: De data wordt gefilterd op een bounding box rondom Arnhem en beperkt tot 1000 resultaten per API call voor performance redenen.

## Technische details

- **Data ophalen**: Automatisch bij opstarten en bij filterwijzigingen
- **Caching**: Geen lokale caching geïmplementeerd
- **Foutafhandeling**: Toont foutmeldingen bij API problemen
- **Responsiviteit**: Werkt op desktop en mobiele apparaten

## Beperkingen

- Alleen Arnhem gebied (hardcoded bounding box)
- Geen offline functionaliteit
- Data afhankelijk van PDOK API beschikbaarheid

## Contact

Dit is een prototype ontwikkeld voor de HAN University of Applied Sciences.</content>
