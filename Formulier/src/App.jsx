import { useEffect, useMemo, useRef, useState } from 'react';
import { buildDerivedProfile, calculateAssessment } from './scoring.js';
import { getSuggestions, optionSets } from './options.js';

const emptyProfile = {
  fullName: '',
  birthYear: '',
  municipality: '',
  currentHousing: '',
  householdType: '',
  householdSize: '1',
  currentRooms: '',
  monthlyIncome: '',
  monthlyRent: '',
  rentArrears: 'nee',
  homelessRisk: 'nee',
  evictionNotice: 'nee',
  safetyIssue: 'nee',
  medicalUrgency: 'nee',
  careNeed: 'Geen',
  accessibilityNeed: 'nee',
  supportNetwork: '',
  underutilizedHome: 'nee',
  moveWillingness: 'Onbekend',
  preferredHousing: '',
  notes: ''
};

const yesNo = [
  { value: 'nee', label: 'Nee' },
  { value: 'ja', label: 'Ja' }
];

const aiLoadingSteps = [
  'Gegevens worden gelezen...',
  'Woonwens en situatie worden vergeleken...',
  'Conceptprofiel wordt voorbereid...'
];

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <Field label={label}>
      <select name={name} value={value} onChange={onChange}>
        <option value="">Kies...</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function AutocompleteField({ label, name, value, onChange, field, placeholder }) {
  const [remoteSuggestions, setRemoteSuggestions] = useState(() => getSuggestions(field, value));

  useEffect(() => {
    const controller = new AbortController();
    const query = encodeURIComponent(value || '');
    fetch(`/api/suggestions?field=${field}&q=${query}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setRemoteSuggestions(data.suggestions || []))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setRemoteSuggestions(getSuggestions(field, value));
        }
      });
    return () => controller.abort();
  }, [field, value]);

  const listId = `${name}-options`;

  return (
    <Field label={label}>
      <input
        name={name}
        value={value}
        onChange={onChange}
        list={listId}
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {remoteSuggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </Field>
  );
}

function getAiQuestions(profile, assessment) {
  const questions = [];
  if (!profile.municipality) questions.push('In welke gemeente zoekt deze persoon vooral?');
  if (!profile.currentHousing) questions.push('Wat is de huidige woonsituatie?');
  if (!profile.monthlyIncome || !profile.monthlyRent) questions.push('Zijn inkomen en woonlasten volledig ingevuld?');
  if (assessment.rentRatio >= 0.4) questions.push('Is er betalingsachterstand of dreiging van schuldopbouw?');
  if (profile.careNeed !== 'Geen' || profile.accessibilityNeed === 'ja') questions.push('Welke woningaanpassing of nabijheid van zorg is noodzakelijk?');
  if (profile.homelessRisk === 'ja' || profile.evictionNotice === 'ja') questions.push('Moet een crisisroute of tijdelijke opvang vandaag worden beoordeeld?');
  if (profile.underutilizedHome === 'ja') questions.push('Is een passend doorstroomaanbod bespreekbaar?');
  return questions.slice(0, 4);
}

function LoadingLine({ message }) {
  return (
    <div className="ai-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <strong>{message}</strong>
    </div>
  );
}

function ProfileSummary({ profile, derivedProfile, isLoading }) {
  const rows = [
    ['Gemeente', profile.municipality || 'Nog niet ingevuld'],
    ['Woonsituatie', profile.currentHousing || 'Nog niet ingevuld'],
    ['Huishouden', profile.householdType || 'Nog niet ingevuld'],
    ['Gewenste woonvorm', derivedProfile.woonbehoefte],
    ['Zorg of toegankelijkheid', profile.careNeed || 'Geen specifieke zorgvraag ingevuld'],
    ['Sociaal netwerk', profile.supportNetwork || 'Nog niet ingevuld']
  ];

  return (
    <section className="panel profile-panel" aria-labelledby="profile-title">
      <div className="section-heading">
        <p>Controle</p>
        <h2 id="profile-title">Samenvatting voor de woningzoekende</h2>
      </div>
      {isLoading ? <LoadingLine message="AI maakt de samenvatting actueel..." /> : null}
      <dl className="profile-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="privacy-box">
        <span>Interne beoordeling</span>
        <strong>De ambtelijke beoordeling is afgeschermd in deze intake.</strong>
        <p>Na opslaan wordt de beoordeling veilig toegevoegd voor de gemeente.</p>
      </div>
    </section>
  );
}

function SavedProfiles({ profiles }) {
  return (
    <section className="panel saved-panel" aria-labelledby="saved-title">
      <div className="section-heading">
        <p>Opslag</p>
        <h2 id="saved-title">Opgeslagen profielen</h2>
      </div>
      {profiles.length === 0 ? (
        <p className="empty-state">Nog geen profielen opgeslagen.</p>
      ) : (
        <div className="saved-list">
          {profiles.map((record) => (
            <article key={record.id} className="saved-item">
              <div>
                <strong>{record.profile.fullName || 'Naam onbekend'}</strong>
                <span>{new Date(record.createdAt).toLocaleString('nl-NL')}</span>
              </div>
              <span className="level-pill opgeslagen">Opgeslagen</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function App({ initialData = { profiles: [] } }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [profiles, setProfiles] = useState(initialData.profiles || []);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [aiState, setAiState] = useState({
    loading: false,
    message: '',
    questions: getAiQuestions(emptyProfile, calculateAssessment(emptyProfile))
  });
  const firstRender = useRef(true);

  const assessment = useMemo(() => calculateAssessment(profile), [profile]);
  const derivedProfile = useMemo(() => buildDerivedProfile(profile, assessment), [profile, assessment]);
  const nextAiQuestions = useMemo(() => getAiQuestions(profile, assessment), [profile, assessment]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }

    let cancelled = false;
    const timers = [];
    setAiState((current) => ({
      ...current,
      loading: true,
      message: aiLoadingSteps[0]
    }));

    timers.push(
      window.setTimeout(() => {
        if (!cancelled) {
          setAiState((current) => ({ ...current, message: aiLoadingSteps[1] }));
        }
      }, 450)
    );
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) {
          setAiState((current) => ({ ...current, message: aiLoadingSteps[2] }));
        }
      }, 900)
    );
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) {
          setAiState({
            loading: false,
            message: '',
            questions: nextAiQuestions
          });
        }
      }, 1350)
    );

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [nextAiQuestions]);

  function updateField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setStatus({ type: 'saving', message: 'AI controleert volledigheid...' });
    try {
      await delay(700);
      setStatus({ type: 'saving', message: 'AI bouwt het ambtelijke profiel op...' });
      await delay(800);
      setStatus({ type: 'saving', message: 'Profiel wordt veilig opgeslagen...' });
      await delay(500);

      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Opslaan mislukt.');
      }
      setProfiles((current) => [data, ...current].slice(0, 8));
      setStatus({ type: 'saved', message: 'Profiel opgeslagen. De interne beoordeling is toegevoegd voor de gemeente.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="product-label">HaaS</span>
          <h1>AI-intake woningzoekende</h1>
        </div>
        <div className="intake-badge">
          <span>Burgerweergave</span>
          <strong>Persoonlijke intake</strong>
        </div>
      </header>

      <section className="ai-status-strip" aria-label="AI status">
        {aiState.loading ? (
          <LoadingLine message={aiState.message} />
        ) : (
          <div className="ready-line">
            <span className="ready-dot" aria-hidden="true" />
            <strong>AI intake klaar voor de volgende stap</strong>
          </div>
        )}
        <p>De ambtelijke beoordeling wordt intern opgeslagen en niet aan de woningzoekende getoond.</p>
      </section>

      <div className="workspace-grid">
        <form className="panel intake-form" onSubmit={saveProfile}>
          <div className="section-heading">
            <p>Intakeformulier</p>
            <h2>Profielgegevens</h2>
          </div>

          <div className="form-grid">
            <Field label="Naam">
              <input name="fullName" value={profile.fullName} onChange={updateField} placeholder="Bijv. Samira Jansen" />
            </Field>
            <Field label="Geboortejaar">
              <input name="birthYear" value={profile.birthYear} onChange={updateField} inputMode="numeric" placeholder="1984" />
            </Field>
            <AutocompleteField
              label="Gemeente"
              name="municipality"
              field="municipality"
              value={profile.municipality}
              onChange={updateField}
              placeholder="Arnhem"
            />
            <AutocompleteField
              label="Huidige woonsituatie"
              name="currentHousing"
              field="currentHousing"
              value={profile.currentHousing}
              onChange={updateField}
              placeholder="Tijdelijke opvang"
            />
            <SelectField
              label="Huishouden"
              name="householdType"
              value={profile.householdType}
              onChange={updateField}
              options={optionSets.householdType}
            />
            <Field label="Aantal personen">
              <input name="householdSize" value={profile.householdSize} onChange={updateField} inputMode="numeric" />
            </Field>
            <Field label="Aantal kamers nu">
              <input name="currentRooms" value={profile.currentRooms} onChange={updateField} inputMode="numeric" />
            </Field>
            <Field label="Netto maandinkomen">
              <input name="monthlyIncome" value={profile.monthlyIncome} onChange={updateField} inputMode="decimal" placeholder="1800" />
            </Field>
            <Field label="Maandelijkse woonlasten">
              <input name="monthlyRent" value={profile.monthlyRent} onChange={updateField} inputMode="decimal" placeholder="760" />
            </Field>
            <SelectField label="Betalingsachterstand" name="rentArrears" value={profile.rentArrears} onChange={updateField} options={yesNo} />
            <SelectField label="Dreigende dakloosheid" name="homelessRisk" value={profile.homelessRisk} onChange={updateField} options={yesNo} />
            <SelectField label="Uitzetting of huuropzegging" name="evictionNotice" value={profile.evictionNotice} onChange={updateField} options={yesNo} />
            <SelectField label="Onveilige situatie" name="safetyIssue" value={profile.safetyIssue} onChange={updateField} options={yesNo} />
            <SelectField label="Medische urgentie" name="medicalUrgency" value={profile.medicalUrgency} onChange={updateField} options={yesNo} />
            <AutocompleteField label="Zorgbehoefte" name="careNeed" field="careNeed" value={profile.careNeed} onChange={updateField} />
            <SelectField label="Toegankelijke woning nodig" name="accessibilityNeed" value={profile.accessibilityNeed} onChange={updateField} options={yesNo} />
            <AutocompleteField label="Sociaal netwerk" name="supportNetwork" field="supportNetwork" value={profile.supportNetwork} onChange={updateField} />
            <SelectField label="Onderbenutte woning" name="underutilizedHome" value={profile.underutilizedHome} onChange={updateField} options={yesNo} />
            <AutocompleteField label="Verhuisbereidheid" name="moveWillingness" field="moveWillingness" value={profile.moveWillingness} onChange={updateField} />
            <AutocompleteField label="Gewenste woonvorm" name="preferredHousing" field="preferredHousing" value={profile.preferredHousing} onChange={updateField} />
          </div>

          <Field label="Aanvullende context">
            <textarea name="notes" value={profile.notes} onChange={updateField} rows="4" placeholder="Korte toelichting voor beoordeling" />
          </Field>

          <div className="ai-box">
            <span>AI-vragenroute</span>
            {aiState.loading ? (
              <LoadingLine message={aiState.message} />
            ) : aiState.questions.length === 0 ? (
              <p>De basisinformatie is compleet genoeg voor een conceptprofiel.</p>
            ) : (
              <ul>
                {aiState.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" disabled={status.type === 'saving'}>
              Profiel opslaan
            </button>
            <button type="button" className="secondary" onClick={() => setProfile(emptyProfile)}>
              Leegmaken
            </button>
            {status.message ? <p className={`status ${status.type}`}>{status.message}</p> : null}
          </div>
        </form>

        <aside className="side-stack">
          <ProfileSummary profile={profile} derivedProfile={derivedProfile} isLoading={aiState.loading} />
          <SavedProfiles profiles={profiles} />
        </aside>
      </div>
    </main>
  );
}
