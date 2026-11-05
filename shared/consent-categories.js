const categoryDefinitions = {
  all: { label: 'All', aliases: ['all', 'all records'] },
  diagnosis: { label: 'Diagnosis', aliases: ['diagnosis', 'diagnoses'] },
  report: { label: 'Reports', aliases: ['report', 'reports'] },
  lab_report: {
    label: 'Lab Results',
    aliases: ['lab', 'labs', 'lab report', 'lab reports', 'lab_result', 'lab results', 'laboratory results'],
  },
  test_request: { label: 'Test Requests', aliases: ['test request', 'test requests'] },
  prescription: {
    label: 'Prescriptions',
    aliases: ['prescription', 'prescriptions', 'authorized prescription', 'authorized prescriptions'],
  },
  medication: {
    label: 'Medications',
    aliases: ['medication', 'medications', 'authorized medication', 'authorized medications'],
  },
  allergy: { label: 'Allergies', aliases: ['allergy', 'allergies'] },
  appointment: { label: 'Appointments', aliases: ['appointment', 'appointments'] },
  clinical_history: { label: 'Clinical History', aliases: ['clinical history'] },
  imaging: { label: 'Imaging', aliases: ['imaging'] },
  admission: { label: 'Admissions', aliases: ['admission', 'admissions'] },
  treatment_record: { label: 'Treatment Records', aliases: ['treatment record', 'treatment records'] },
  vaccination: { label: 'Vaccinations', aliases: ['vaccination', 'vaccinations'] },
  upload: { label: 'Uploads', aliases: ['upload', 'uploads'] },
  identity: { label: 'Identity', aliases: ['identity'] },
  authorized_claim: { label: 'Authorized Claims', aliases: ['authorized claim', 'authorized claims', 'claim', 'claims'] },
  required_document: { label: 'Required Documents', aliases: ['required document', 'required documents', 'document', 'documents'] },
};

function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

const aliasToCategory = new Map();
for (const [key, definition] of Object.entries(categoryDefinitions)) {
  aliasToCategory.set(normalizeToken(key), key);
  for (const alias of definition.aliases) aliasToCategory.set(normalizeToken(alias), key);
}

const categoryRequirements = {
  lab_report: ['lab_report', 'report', 'test_request'],
  lab: ['lab_report', 'report', 'test_request'],
  imaging: ['report', 'clinical_history', 'treatment_record'],
  visit: ['appointment', 'clinical_history'],
  discharge: ['admission', 'clinical_history', 'treatment_record'],
  prescription: ['prescription', 'medication'],
  vaccination: ['clinical_history', 'report'],
  upload: ['report', 'clinical_history'],
};

const roleRequestedCategories = {
  doctor: ['Diagnoses', 'Reports', 'Labs', 'Prescriptions', 'Medications', 'Allergies', 'Appointments'],
  hospital: ['Clinical history', 'Admissions', 'Reports', 'Treatment records'],
  laboratory: ['Identity', 'Test requests', 'Lab results'],
  pharmacy: ['Authorized prescriptions', 'Medications'],
  insurance: ['Authorized claims', 'Required documents'],
};

export function normalizeConsentCategory(value) {
  const token = normalizeToken(value);
  return aliasToCategory.get(token) ?? token.replace(/\s+/g, '_');
}

function splitCategories(value) {
  if (Array.isArray(value)) return value.flatMap((item) => splitCategories(item));
  if (typeof value !== 'string') return [];
  return value.split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
}

export function normalizeConsentCategories(value) {
  const keys = [...new Set(splitCategories(value).map(normalizeConsentCategory).filter(Boolean))];
  return keys.map((key) => categoryDefinitions[key]?.label ?? key.replace(/_/g, ' ')).join(', ');
}

export function consentCategoriesForRole(role) {
  return normalizeConsentCategories(roleRequestedCategories[normalizeToken(role)] ?? ['Reports']);
}

export function grantAllowsConsentCategory(grantOrCategories, category) {
  const categories = typeof grantOrCategories === 'string'
    ? grantOrCategories
    : grantOrCategories?.categories;
  const granted = new Set(splitCategories(categories).map(normalizeConsentCategory));
  if (granted.has('all')) return true;
  const requested = normalizeConsentCategory(category);
  const required = categoryRequirements[requested] ?? [requested];
  return required.some((item) => granted.has(item));
}
