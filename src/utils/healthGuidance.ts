export type Severity = 'mild' | 'moderate' | 'severe' | 'not-sure'
export type SexAtBirth = 'female' | 'male' | 'intersex' | 'prefer-not-to-say' | ''
export type PregnancyPossibility = 'yes' | 'no' | 'not-sure' | 'not-applicable' | ''
export type CountrySetting = 'uk' | 'other' | ''
export type Urgency = 'emergency' | 'urgent' | 'soon' | 'routine' | 'self-care'

export type ConsultationInput = {
  concern: string
  mainSymptom: string
  started: string
  severity: Severity
  location: string
  feeling: string
  betterWorse: string
  otherSymptoms: string
  medicalBackground: string
  medicines: string
  allergies: string
  ageRange: string
  sexAtBirth: SexAtBirth
  pregnancyPossibility: PregnancyPossibility
  country: CountrySetting
}

export type GuidanceResponse = {
  headline: string
  urgency: Urgency
  emergency: boolean
  summary: string[]
  possibleExplanations: string[]
  selfCare: string[]
  seekHelp: string[]
  questions: string[]
  warningSigns: string[]
  followUpQuestions: string[]
  safetyDisclaimer: string
  escalationMessage?: string
}

const urgentEmergencyLine = (country: CountrySetting): string =>
  country === 'uk'
    ? 'If severe symptoms are happening now or getting rapidly worse, call 999 or 112 immediately. For urgent advice that is not life-threatening, use NHS 111.'
    : 'If severe symptoms are happening now or getting rapidly worse, contact your local emergency service immediately.'

const routineSupportLine = (country: CountrySetting): string =>
  country === 'uk'
    ? 'For non-emergency advice, a pharmacist, GP, or NHS 111 may help you decide what to do next.'
    : 'For non-emergency advice, contact a pharmacist, primary care clinician, urgent care, or your local health service as appropriate.'

const normalize = (...values: string[]): string => values.join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')

const includesAny = (text: string, patterns: string[]): boolean => patterns.some((pattern) => text.includes(pattern))

const pushUnique = (list: string[], ...items: string[]) => {
  for (const item of items) {
    if (item && !list.includes(item)) {
      list.push(item)
    }
  }
}

const getSymptomCategory = (text: string): string => {
  if (includesAny(text, ['chest', 'breath', 'wheez', 'cough', 'asthma'])) return 'breathing or chest symptoms'
  if (includesAny(text, ['headache', 'migraine', 'dizz', 'faint', 'stroke', 'weakness', 'numb'])) return 'neurological symptoms'
  if (includesAny(text, ['sick', 'vomit', 'nausea', 'diarr', 'stomach', 'abdominal', 'tummy'])) return 'digestive symptoms'
  if (includesAny(text, ['rash', 'itch', 'skin', 'swelling', 'allerg'])) return 'skin or allergy symptoms'
  if (includesAny(text, ['urine', 'pee', 'burning', 'bladder'])) return 'urinary symptoms'
  if (includesAny(text, ['anxious', 'panic', 'low mood', 'depress', 'suicid'])) return 'mental health symptoms'
  if (includesAny(text, ['back', 'joint', 'muscle', 'sprain', 'injury'])) return 'muscle, joint, or injury symptoms'
  return 'general symptoms'
}

const buildSummary = (input: ConsultationInput): string[] => {
  const summary = [
    input.concern || 'You described a health concern.',
    input.mainSymptom ? `Main symptom: ${input.mainSymptom}.` : '',
    input.started ? `Started: ${input.started}.` : '',
    input.severity !== 'not-sure' ? `Severity: ${input.severity}.` : '',
    input.location ? `Location: ${input.location}.` : '',
    input.feeling ? `How it feels: ${input.feeling}.` : '',
    input.otherSymptoms ? `Other symptoms: ${input.otherSymptoms}.` : '',
    input.medicines ? `Medicines mentioned: ${input.medicines}.` : '',
    input.allergies ? `Allergies mentioned: ${input.allergies}.` : '',
  ].filter(Boolean)

  return summary.length > 0 ? summary : ['You have not entered enough information to summarise the concern yet.']
}

const buildQuestions = (input: ConsultationInput): string[] => {
  const questions = [
    'What warning signs should make me seek urgent or emergency care?',
    'What else would you need to know to narrow down the likely causes?',
  ]

  if (!input.started) {
    pushUnique(questions, 'How long have these symptoms been happening, and what change in timing would matter most?')
  }

  if (input.medicines) {
    pushUnique(questions, 'Could any of my current medicines be making this better or worse?')
  }

  if (includesAny(normalize(input.mainSymptom, input.concern, input.otherSymptoms), ['chest', 'breath', 'heart'])) {
    pushUnique(questions, 'Do I need an in-person assessment, ECG, oxygen check, or other urgent review?')
  }

  if (includesAny(normalize(input.mainSymptom, input.concern, input.otherSymptoms), ['rash', 'allerg', 'swelling'])) {
    pushUnique(questions, 'Could this be an allergic reaction, infection, or something needing urgent treatment?')
  }

  return questions.slice(0, 5)
}

export const generateVisitSummary = (input: ConsultationInput, response: GuidanceResponse): string => {
  const lines = [
    'Healthcare Visit Summary',
    '',
    'Symptoms described:',
    ...buildSummary(input).map((item) => `- ${item}`),
    '',
    'General guidance from AI Doctor:',
    ...response.selfCare.map((item) => `- ${item}`),
    '',
    'When to seek help:',
    ...response.seekHelp.map((item) => `- ${item}`),
    '',
    'Questions for a clinician:',
    ...response.questions.map((item) => `- ${item}`),
    '',
    `Recommended level of care: ${response.urgency}`,
    '',
    'Important: This summary is generated from the information you entered. It is not a diagnosis, prescription, or official medical record.',
  ]

  return lines.join('\n')
}

export const getGuidance = (input: ConsultationInput): GuidanceResponse => {
  const narrative = normalize(
    input.concern,
    input.mainSymptom,
    input.location,
    input.feeling,
    input.otherSymptoms,
    input.medicalBackground,
    input.betterWorse,
  )

  const category = getSymptomCategory(narrative)
  const followUpQuestions: string[] = []
  const warningSigns: string[] = []
  const selfCare: string[] = []
  const possibleExplanations: string[] = []
  const seekHelp: string[] = []

  const severe = input.severity === 'severe'
  const sudden = includesAny(narrative, ['sudden', 'suddenly', 'minutes', 'rapid', 'rapidly', 'worst ever'])
  const breathing = includesAny(narrative, ['breath', 'breathing', 'shortness of breath', 'wheez'])
  const chestPain = includesAny(narrative, ['chest pain', 'chest tight', 'pressure in chest', 'heart pain'])
  const strokeLike = includesAny(narrative, ['face droop', 'slurred speech', 'one sided weakness', 'arm weakness', 'stroke', 'can t speak', 'numb'])
  const allergy = includesAny(narrative, ['allerg', 'anaphyl', 'swelling', 'swollen lips', 'swollen tongue', 'hives'])
  const unconscious = includesAny(narrative, ['unconscious', 'passed out', 'collapse', 'fainted'])
  const seizure = includesAny(narrative, ['seizure', 'fit', 'convulsion'])
  const bleeding = includesAny(narrative, ['heavy bleeding', 'won t stop bleeding', 'uncontrolled bleeding'])
  const suicidal = includesAny(narrative, ['suicide', 'kill myself', 'want to die', 'self harm', 'hurt myself'])
  const confusion = includesAny(narrative, ['confusion', 'confused', 'not making sense'])
  const headInjury = includesAny(narrative, ['head injury', 'serious injury', 'car crash', 'fell from'])
  const abdominalPain = includesAny(narrative, ['abdominal', 'stomach pain', 'tummy pain'])
  const fever = includesAny(narrative, ['fever', 'temperature', 'hot and cold'])
  const pregnancyRelated = input.pregnancyPossibility === 'yes' || includesAny(narrative, ['pregnan'])

  if (!input.mainSymptom) {
    pushUnique(followUpQuestions, 'What is the main symptom or problem you want help understanding?')
  }
  if (!input.started) {
    pushUnique(followUpQuestions, 'When did this start, and is it getting better, worse, or staying the same?')
  }
  if (input.severity === 'not-sure') {
    pushUnique(followUpQuestions, 'How severe does this feel right now: mild, moderate, or severe?')
  }
  if ((breathing || chestPain || abdominalPain) && !input.location) {
    pushUnique(followUpQuestions, 'Where exactly do you feel the symptom, and does it spread anywhere else?')
  }
  if ((breathing || chestPain || strokeLike || abdominalPain) && !input.otherSymptoms) {
    pushUnique(followUpQuestions, 'What other symptoms are happening at the same time?')
  }

  const emergency =
    suicidal ||
    unconscious ||
    seizure ||
    bleeding ||
    headInjury ||
    confusion ||
    (breathing && (severe || sudden)) ||
    (chestPain && (severe || breathing || sudden)) ||
    (strokeLike && sudden) ||
    (allergy && (breathing || includesAny(narrative, ['tongue', 'throat'])))

  if (emergency) {
    pushUnique(
      warningSigns,
      'Severe or rapidly worsening symptoms can need immediate assessment.',
      'Do not drive yourself if you feel unsafe or might lose consciousness.',
    )

    if (chestPain) pushUnique(warningSigns, 'Severe chest pain, tightness, or pressure can be an emergency.')
    if (breathing) pushUnique(warningSigns, 'Severe difficulty breathing should be treated as urgent.')
    if (strokeLike) pushUnique(warningSigns, 'Sudden weakness, numbness, facial droop, or speech problems should be treated as possible stroke symptoms.')
    if (allergy) pushUnique(warningSigns, 'Swelling of the lips, tongue, or throat can signal a severe allergic reaction.')
    if (suicidal) pushUnique(warningSigns, 'Immediate support is important if you may act on thoughts of harming yourself.')

    return {
      headline: 'Could this be an emergency?',
      urgency: 'emergency',
      emergency: true,
      summary: buildSummary(input),
      possibleExplanations: [
        'Some of the symptoms you entered can happen in serious or life-threatening conditions.',
        'AI Doctor cannot safely rule out emergencies from chat information alone.',
      ],
      selfCare: [
        'Seek emergency help now rather than monitoring this on your own.',
        'If another person is available, ask them to stay with you or help you contact emergency care.',
      ],
      seekHelp: [urgentEmergencyLine(input.country)],
      questions: buildQuestions(input),
      warningSigns,
      followUpQuestions,
      safetyDisclaimer:
        'AI Doctor cannot examine you or diagnose emergencies. Emergency symptoms need real-world urgent assessment.',
      escalationMessage: urgentEmergencyLine(input.country),
    }
  }

  if (includesAny(narrative, ['chest pain', 'shortness of breath', 'numb', 'weak']) && followUpQuestions.length > 0) {
    pushUnique(
      warningSigns,
      'Because these symptoms can sometimes be serious, worsening symptoms should not wait for an online reply.',
    )
  }

  if (breathing || chestPain) {
    pushUnique(
      possibleExplanations,
      'Breathing or chest symptoms can have causes ranging from infections and muscle strain to asthma, heart, or circulation problems.',
      'The exact meaning depends on severity, timing, triggers, and associated symptoms such as dizziness, fever, or pain spreading to the jaw or arm.',
    )
    pushUnique(
      selfCare,
      'Rest, avoid strenuous activity, and note whether symptoms are getting worse or happening at rest.',
      'If symptoms are new, persistent, or accompanied by dizziness, fainting, or worsening breathlessness, seek urgent assessment.',
    )
  } else if (abdominalPain) {
    pushUnique(
      possibleExplanations,
      'Digestive symptoms can happen with indigestion, infection, constipation, food intolerance, or inflammation.',
      'Severe, one-sided, or worsening pain needs more urgent review, especially if you also have fever, vomiting, fainting, or pregnancy-related concerns.',
    )
    pushUnique(
      selfCare,
      'Sip fluids if you can keep them down and avoid alcohol or heavy meals until you know what worsens the pain.',
      'Keep track of vomiting, bowel changes, fever, or worsening pain.',
    )
  } else if (includesAny(narrative, ['headache', 'migraine', 'dizz'])) {
    pushUnique(
      possibleExplanations,
      'Headache or dizziness can happen with dehydration, stress, viral illness, migraine, blood pressure changes, or other neurological causes.',
      'Sudden severe headache, neurological changes, or ongoing vomiting should be assessed urgently.',
    )
    pushUnique(
      selfCare,
      'Hydrate, rest in a calm environment, and avoid driving if you feel faint or your vision is affected.',
    )
  } else if (includesAny(narrative, ['rash', 'skin', 'itch', 'allerg'])) {
    pushUnique(
      possibleExplanations,
      'Skin symptoms may relate to irritation, allergy, eczema, infection, or a reaction to medication or another trigger.',
      'Rapid spreading, facial swelling, or blistering needs faster medical advice.',
    )
    pushUnique(
      selfCare,
      'Avoid new irritants if possible and note any recent medicines, foods, or products that might be related.',
    )
  } else {
    pushUnique(
      possibleExplanations,
      `Your description fits ${category}, but several different causes are possible from the information provided.`,
      'A clinician would use the timing, severity, medical background, examination, and sometimes tests to narrow this down.',
    )
    pushUnique(
      selfCare,
      'Monitor whether symptoms are improving, stable, or getting worse, and avoid anything that clearly makes them worse.',
      'Keep notes on timing, triggers, and associated symptoms so you can share them with a clinician if needed.',
    )
  }

  let urgency: Urgency = 'self-care'
  if (severe || confusion || pregnancyRelated || includesAny(narrative, ['getting worse', 'worsening', 'can t keep fluids', 'cannot keep fluids'])) {
    urgency = 'urgent'
  } else if (fever || includesAny(narrative, ['persistent', 'ongoing', 'few days', 'week', 'weeks'])) {
    urgency = 'soon'
  } else if (followUpQuestions.length > 0) {
    urgency = 'routine'
  }

  if (pregnancyRelated && includesAny(narrative, ['pain', 'bleeding', 'dizz', 'vomit'])) {
    urgency = 'urgent'
    pushUnique(
      warningSigns,
      'Pain, bleeding, fainting, or severe vomiting during possible pregnancy should be assessed promptly.',
    )
  }

  pushUnique(seekHelp, routineSupportLine(input.country))
  if (urgency === 'urgent') {
    pushUnique(
      seekHelp,
      input.country === 'uk'
        ? 'Arrange same-day advice from NHS 111, a GP, urgent care, or emergency services if symptoms worsen.'
        : 'Arrange same-day advice from urgent care, primary care, or your local health service, and escalate to emergency care if symptoms worsen.',
    )
  } else if (urgency === 'soon') {
    pushUnique(
      seekHelp,
      input.country === 'uk'
        ? 'Book a GP or pharmacist review soon if symptoms are not settling, and use NHS 111 if you are unsure where to go.'
        : 'Book a clinician or pharmacist review soon if symptoms are not settling, and use urgent care if you are unsure where to go.',
    )
  } else if (urgency === 'routine') {
    pushUnique(seekHelp, 'Seek earlier review if the symptoms become more severe, spread, or new red-flag symptoms appear.')
  } else {
    pushUnique(seekHelp, 'If symptoms do not improve, keep coming back, or you feel less safe, seek professional medical advice.')
  }

  if (warningSigns.length === 0) {
    pushUnique(
      warningSigns,
      'Seek urgent help if severe pain, trouble breathing, fainting, new weakness, confusion, or rapid worsening develops.',
    )
  }

  return {
    headline: urgency === 'urgent' ? 'You may need prompt medical advice' : 'Here is a safety-first summary',
    urgency,
    emergency: false,
    summary: buildSummary(input),
    possibleExplanations,
    selfCare,
    seekHelp,
    questions: buildQuestions(input),
    warningSigns,
    followUpQuestions,
    safetyDisclaimer:
      'AI Doctor provides health information and symptom guidance only. It cannot diagnose you, examine you, or replace professional medical assessment.',
  }
}
