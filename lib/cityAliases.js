// GTA Metro Cluster - City Normalization for Dense Matching

const GTA_CITIES = {
  // Core Toronto
  'toronto': 'toronto',
  'tdot': 'toronto',
  't.o.': 'toronto',
  'the 6': 'toronto',
  'the 6ix': 'toronto',
  'yyz': 'toronto',
  
  // Mississauga
  'mississauga': 'toronto',
  'sauga': 'toronto',
  'missisauga': 'toronto',
  'mississauaga': 'toronto',
  
  // Brampton
  'brampton': 'toronto',
  'bramption': 'toronto',
  
  // Vaughan
  'vaughan': 'toronto',
  'vaughn': 'toronto',
  
  // Markham
  'markham': 'toronto',
  
  // Richmond Hill
  'richmond hill': 'toronto',
  'richmondhill': 'toronto',
  
  // Scarborough
  'scarborough': 'toronto',
  'scarbrough': 'toronto',
  'scarboro': 'toronto',
  
  // Etobicoke
  'etobicoke': 'toronto',
  'etobico': 'toronto',
  
  // North York
  'north york': 'toronto',
  'northyork': 'toronto',
  
  // Oakville
  'oakville': 'toronto',
  
  // Ajax
  'ajax': 'toronto',
  
  // Pickering
  'pickering': 'toronto',
  
  // Burlington
  'burlington': 'toronto'
};

export function normalizeCity(city) {
  if (!city) return null;
  
  const cleaned = city
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ');
  
  return GTA_CITIES[cleaned] || null;
}

export function isGTA(city) {
  return normalizeCity(city) === 'toronto';
}

export function getGTACities() {
  return [
    'Toronto',
    'Mississauga',
    'Brampton',
    'Vaughan',
    'Markham',
    'Richmond Hill',
    'Scarborough',
    'Etobicoke',
    'North York',
    'Oakville',
    'Ajax',
    'Pickering',
    'Burlington'
  ];
}