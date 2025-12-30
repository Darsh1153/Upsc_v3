// UPSC Roadmap Data Structure
// Contains predefined topics, subtopics, and study sources

export const DIFFICULTY_LEVELS = {
  BASIC: 'Basic',
  MODERATE: 'Moderate',
  ADVANCED: 'Advanced',
};

export const PRIORITY_LEVELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const TOPIC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const REVISION_STATUS = {
  NOT_STARTED: 'not_started',
  FIRST_READ: 'first_read',
  FIRST_REVISION: 'first_revision',
  SECOND_REVISION: 'second_revision',
  FINAL_REVISION: 'final_revision',
};

export const SOURCE_TYPES = {
  NCERT: 'NCERT',
  BOOK: 'Book',
  WEBSITE: 'Website',
  YOUTUBE: 'YouTube',
  PDF: 'PDF',
  NOTES: 'Notes',
  CUSTOM: 'Custom',
};

// GS Paper 1 - Indian Heritage, History, Geography
const GS1_TOPICS = [
  {
    id: 'gs1_ancient_history',
    name: 'Ancient Indian History',
    paper: 'GS1',
    icon: '🏛️',
    estimatedHours: 40,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs1_ah_1', name: 'Indus Valley Civilization', estimatedHours: 4 },
      { id: 'gs1_ah_2', name: 'Vedic Period', estimatedHours: 4 },
      { id: 'gs1_ah_3', name: 'Jainism & Buddhism', estimatedHours: 5 },
      { id: 'gs1_ah_4', name: 'Mauryan Empire', estimatedHours: 5 },
      { id: 'gs1_ah_5', name: 'Post-Mauryan Period', estimatedHours: 4 },
      { id: 'gs1_ah_6', name: 'Gupta Empire', estimatedHours: 4 },
      { id: 'gs1_ah_7', name: 'South Indian Kingdoms', estimatedHours: 5 },
      { id: 'gs1_ah_8', name: 'Art & Architecture', estimatedHours: 5 },
      { id: 'gs1_ah_9', name: 'Literature & Science', estimatedHours: 4 },
      { id: 'gs1_ah_10', name: 'test_sub_topic', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 6 - Our Pasts I', link: '' },
      { type: SOURCE_TYPES.NCERT, name: 'Class 11 - Themes in World History', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'India\'s Ancient Past - R.S. Sharma', link: '' },
      { type: SOURCE_TYPES.YOUTUBE, name: 'Ancient History by Unacademy', link: '' },
    ],
  },
  {
    id: 'gs1_medieval_history',
    name: 'Medieval Indian History',
    paper: 'GS1',
    icon: '⚔️',
    estimatedHours: 35,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs1_mh_1', name: 'Delhi Sultanate', estimatedHours: 6 },
      { id: 'gs1_mh_2', name: 'Vijayanagara Empire', estimatedHours: 4 },
      { id: 'gs1_mh_3', name: 'Mughal Empire', estimatedHours: 8 },
      { id: 'gs1_mh_4', name: 'Bhakti & Sufi Movement', estimatedHours: 4 },
      { id: 'gs1_mh_5', name: 'Maratha Empire', estimatedHours: 5 },
      { id: 'gs1_mh_6', name: 'Regional Kingdoms', estimatedHours: 4 },
      { id: 'gs1_mh_7', name: 'Art, Architecture & Culture', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 7 - Our Pasts II', link: '' },
      { type: SOURCE_TYPES.NCERT, name: 'Class 12 - Themes in Indian History II', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Medieval India - Satish Chandra', link: '' },
    ],
  },
  {
    id: 'gs1_modern_history',
    name: 'Modern Indian History',
    paper: 'GS1',
    icon: '🇮🇳',
    estimatedHours: 50,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs1_modh_1', name: 'Advent of Europeans', estimatedHours: 4 },
      { id: 'gs1_modh_2', name: 'British Expansion', estimatedHours: 5 },
      { id: 'gs1_modh_3', name: 'Revolt of 1857', estimatedHours: 4 },
      { id: 'gs1_modh_4', name: 'Social Reform Movements', estimatedHours: 5 },
      { id: 'gs1_modh_5', name: 'Indian National Congress', estimatedHours: 4 },
      { id: 'gs1_modh_6', name: 'Moderate & Extremist Phase', estimatedHours: 5 },
      { id: 'gs1_modh_7', name: 'Gandhi Era', estimatedHours: 8 },
      { id: 'gs1_modh_8', name: 'Revolutionary Movements', estimatedHours: 4 },
      { id: 'gs1_modh_9', name: 'Partition & Independence', estimatedHours: 5 },
      { id: 'gs1_modh_10', name: 'Post-Independence India', estimatedHours: 6 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 8 - Our Pasts III', link: '' },
      { type: SOURCE_TYPES.NCERT, name: 'Class 12 - Themes in Indian History III', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'India\'s Struggle for Independence - Bipan Chandra', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Spectrum Modern History', link: '' },
    ],
  },
  {
    id: 'gs1_world_history',
    name: 'World History',
    paper: 'GS1',
    icon: '🌍',
    estimatedHours: 25,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.MEDIUM,
    subtopics: [
      { id: 'gs1_wh_1', name: 'Industrial Revolution', estimatedHours: 4 },
      { id: 'gs1_wh_2', name: 'French Revolution', estimatedHours: 3 },
      { id: 'gs1_wh_3', name: 'American Revolution', estimatedHours: 3 },
      { id: 'gs1_wh_4', name: 'World Wars', estimatedHours: 6 },
      { id: 'gs1_wh_5', name: 'Colonialism & Decolonization', estimatedHours: 5 },
      { id: 'gs1_wh_6', name: 'Cold War', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 9 & 10 History', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Mastering Modern World History - Norman Lowe', link: '' },
    ],
  },
  {
    id: 'gs1_geography',
    name: 'Indian & World Geography',
    paper: 'GS1',
    icon: '🗺️',
    estimatedHours: 60,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs1_geo_1', name: 'Physical Geography Basics', estimatedHours: 8 },
      { id: 'gs1_geo_2', name: 'Geomorphology', estimatedHours: 6 },
      { id: 'gs1_geo_3', name: 'Climatology', estimatedHours: 8 },
      { id: 'gs1_geo_4', name: 'Oceanography', estimatedHours: 5 },
      { id: 'gs1_geo_5', name: 'Indian Physical Geography', estimatedHours: 8 },
      { id: 'gs1_geo_6', name: 'Human Geography', estimatedHours: 8 },
      { id: 'gs1_geo_7', name: 'Economic Geography', estimatedHours: 8 },
      { id: 'gs1_geo_8', name: 'Environmental Geography', estimatedHours: 5 },
      { id: 'gs1_geo_9', name: 'Map Reading & Practice', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 11 - Fundamentals of Physical Geography', link: '' },
      { type: SOURCE_TYPES.NCERT, name: 'Class 12 - India: Physical Environment', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Certificate Physical Geography - G.C. Leong', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Indian Geography - Majid Husain', link: '' },
    ],
  },
  {
    id: 'gs1_art_culture',
    name: 'Indian Art & Culture',
    paper: 'GS1',
    icon: '🎭',
    estimatedHours: 30,
    difficulty: DIFFICULTY_LEVELS.BASIC,
    priority: PRIORITY_LEVELS.MEDIUM,
    subtopics: [
      { id: 'gs1_ac_1', name: 'Indian Architecture', estimatedHours: 6 },
      { id: 'gs1_ac_2', name: 'Painting Traditions', estimatedHours: 4 },
      { id: 'gs1_ac_3', name: 'Music & Dance', estimatedHours: 5 },
      { id: 'gs1_ac_4', name: 'Literature & Languages', estimatedHours: 5 },
      { id: 'gs1_ac_5', name: 'Religion & Philosophy', estimatedHours: 5 },
      { id: 'gs1_ac_6', name: 'Festivals & Fairs', estimatedHours: 3 },
      { id: 'gs1_ac_7', name: 'UNESCO Heritage Sites', estimatedHours: 2 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 11 - An Introduction to Indian Art', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Indian Art and Culture - Nitin Singhania', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'CCRT Website & Publications', link: '' },
    ],
  },
];

// GS Paper 2 - Governance, Constitution, Social Justice, IR
const GS2_TOPICS = [
  {
    id: 'gs2_polity',
    name: 'Indian Polity & Constitution',
    paper: 'GS2',
    icon: '⚖️',
    estimatedHours: 70,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs2_pol_1', name: 'Historical Background', estimatedHours: 4 },
      { id: 'gs2_pol_2', name: 'Preamble & Basic Structure', estimatedHours: 5 },
      { id: 'gs2_pol_3', name: 'Fundamental Rights', estimatedHours: 8 },
      { id: 'gs2_pol_4', name: 'Directive Principles & Duties', estimatedHours: 5 },
      { id: 'gs2_pol_5', name: 'Union Executive', estimatedHours: 6 },
      { id: 'gs2_pol_6', name: 'Parliament', estimatedHours: 8 },
      { id: 'gs2_pol_7', name: 'State Executive & Legislature', estimatedHours: 6 },
      { id: 'gs2_pol_8', name: 'Judiciary', estimatedHours: 8 },
      { id: 'gs2_pol_9', name: 'Federal System', estimatedHours: 5 },
      { id: 'gs2_pol_10', name: 'Local Government', estimatedHours: 5 },
      { id: 'gs2_pol_11', name: 'Constitutional Bodies', estimatedHours: 6 },
      { id: 'gs2_pol_12', name: 'Elections & Representation', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 11 - Indian Constitution at Work', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Indian Polity - M. Laxmikanth', link: '' },
      { type: SOURCE_TYPES.WEBSITE, name: 'PRS Legislative Research', link: 'https://prsindia.org' },
    ],
  },
  {
    id: 'gs2_governance',
    name: 'Governance & Administration',
    paper: 'GS2',
    icon: '🏛️',
    estimatedHours: 40,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs2_gov_1', name: 'Government Policies & Schemes', estimatedHours: 10 },
      { id: 'gs2_gov_2', name: 'E-Governance Initiatives', estimatedHours: 5 },
      { id: 'gs2_gov_3', name: 'Transparency & Accountability', estimatedHours: 5 },
      { id: 'gs2_gov_4', name: 'Citizens Charters', estimatedHours: 3 },
      { id: 'gs2_gov_5', name: 'Civil Services & Role', estimatedHours: 5 },
      { id: 'gs2_gov_6', name: 'Self Help Groups & NGOs', estimatedHours: 4 },
      { id: 'gs2_gov_7', name: 'Welfare Schemes', estimatedHours: 8 },
    ],
    sources: [
      { type: SOURCE_TYPES.BOOK, name: 'Governance in India - M. Laxmikanth', link: '' },
      { type: SOURCE_TYPES.WEBSITE, name: 'PIB', link: 'https://pib.gov.in' },
      { type: SOURCE_TYPES.WEBSITE, name: 'Government Scheme Portals', link: '' },
    ],
  },
  {
    id: 'gs2_social_justice',
    name: 'Social Justice',
    paper: 'GS2',
    icon: '👥',
    estimatedHours: 35,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.MEDIUM,
    subtopics: [
      { id: 'gs2_sj_1', name: 'Welfare of Vulnerable Sections', estimatedHours: 8 },
      { id: 'gs2_sj_2', name: 'Education', estimatedHours: 6 },
      { id: 'gs2_sj_3', name: 'Health', estimatedHours: 6 },
      { id: 'gs2_sj_4', name: 'Poverty & Hunger', estimatedHours: 5 },
      { id: 'gs2_sj_5', name: 'Human Development', estimatedHours: 5 },
      { id: 'gs2_sj_6', name: 'Issues Related to Women & Children', estimatedHours: 5 },
    ],
    sources: [
      { type: SOURCE_TYPES.WEBSITE, name: 'NITI Aayog Reports', link: 'https://niti.gov.in' },
      { type: SOURCE_TYPES.WEBSITE, name: 'Ministry Websites', link: '' },
    ],
  },
  {
    id: 'gs2_ir',
    name: 'International Relations',
    paper: 'GS2',
    icon: '🌐',
    estimatedHours: 45,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs2_ir_1', name: 'India & Neighbors', estimatedHours: 10 },
      { id: 'gs2_ir_2', name: 'India & Major Powers', estimatedHours: 8 },
      { id: 'gs2_ir_3', name: 'Regional Groupings', estimatedHours: 6 },
      { id: 'gs2_ir_4', name: 'International Organizations', estimatedHours: 8 },
      { id: 'gs2_ir_5', name: 'Bilateral & Multilateral Treaties', estimatedHours: 5 },
      { id: 'gs2_ir_6', name: 'Indian Diaspora', estimatedHours: 4 },
      { id: 'gs2_ir_7', name: 'Global Issues & India\'s Stand', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 12 - Contemporary World Politics', link: '' },
      { type: SOURCE_TYPES.WEBSITE, name: 'MEA Website', link: 'https://mea.gov.in' },
      { type: SOURCE_TYPES.WEBSITE, name: 'IDSA', link: 'https://idsa.in' },
    ],
  },
];

// GS Paper 3 - Economy, Environment, S&T, Security
const GS3_TOPICS = [
  {
    id: 'gs3_economy',
    name: 'Indian Economy',
    paper: 'GS3',
    icon: '💰',
    estimatedHours: 80,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs3_eco_1', name: 'Economic Development & Planning', estimatedHours: 8 },
      { id: 'gs3_eco_2', name: 'Inclusive Growth', estimatedHours: 6 },
      { id: 'gs3_eco_3', name: 'Budgeting & Fiscal Policy', estimatedHours: 8 },
      { id: 'gs3_eco_4', name: 'Monetary Policy & Banking', estimatedHours: 10 },
      { id: 'gs3_eco_5', name: 'Agriculture', estimatedHours: 10 },
      { id: 'gs3_eco_6', name: 'Industry & Infrastructure', estimatedHours: 10 },
      { id: 'gs3_eco_7', name: 'External Sector', estimatedHours: 8 },
      { id: 'gs3_eco_8', name: 'Investment Models', estimatedHours: 5 },
      { id: 'gs3_eco_9', name: 'Employment & Labour', estimatedHours: 5 },
      { id: 'gs3_eco_10', name: 'Government Schemes (Economic)', estimatedHours: 10 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 11 & 12 Economics', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Indian Economy - Ramesh Singh', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Economic Survey', link: '' },
    ],
  },
  {
    id: 'gs3_environment',
    name: 'Environment & Ecology',
    paper: 'GS3',
    icon: '🌱',
    estimatedHours: 45,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs3_env_1', name: 'Ecology Basics', estimatedHours: 6 },
      { id: 'gs3_env_2', name: 'Biodiversity', estimatedHours: 8 },
      { id: 'gs3_env_3', name: 'Climate Change', estimatedHours: 8 },
      { id: 'gs3_env_4', name: 'Environmental Pollution', estimatedHours: 6 },
      { id: 'gs3_env_5', name: 'Environmental Laws & Policies', estimatedHours: 5 },
      { id: 'gs3_env_6', name: 'Conservation Efforts', estimatedHours: 6 },
      { id: 'gs3_env_7', name: 'International Conventions', estimatedHours: 6 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 12 Biology (Ecology)', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'Environment - Shankar IAS', link: '' },
      { type: SOURCE_TYPES.WEBSITE, name: 'Down to Earth', link: 'https://downtoearth.org.in' },
    ],
  },
  {
    id: 'gs3_science_tech',
    name: 'Science & Technology',
    paper: 'GS3',
    icon: '🔬',
    estimatedHours: 40,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.MEDIUM,
    subtopics: [
      { id: 'gs3_st_1', name: 'Space Technology', estimatedHours: 6 },
      { id: 'gs3_st_2', name: 'Defense Technology', estimatedHours: 5 },
      { id: 'gs3_st_3', name: 'IT & Computers', estimatedHours: 5 },
      { id: 'gs3_st_4', name: 'Biotechnology', estimatedHours: 6 },
      { id: 'gs3_st_5', name: 'Nuclear Technology', estimatedHours: 4 },
      { id: 'gs3_st_6', name: 'Nanotechnology', estimatedHours: 3 },
      { id: 'gs3_st_7', name: 'Robotics & AI', estimatedHours: 5 },
      { id: 'gs3_st_8', name: 'Health & Medicine', estimatedHours: 6 },
    ],
    sources: [
      { type: SOURCE_TYPES.NCERT, name: 'Class 10-12 Science', link: '' },
      { type: SOURCE_TYPES.WEBSITE, name: 'ISRO', link: 'https://isro.gov.in' },
      { type: SOURCE_TYPES.WEBSITE, name: 'Science Reporter', link: '' },
    ],
  },
  {
    id: 'gs3_security',
    name: 'Internal Security',
    paper: 'GS3',
    icon: '🛡️',
    estimatedHours: 35,
    difficulty: DIFFICULTY_LEVELS.MODERATE,
    priority: PRIORITY_LEVELS.MEDIUM,
    subtopics: [
      { id: 'gs3_sec_1', name: 'Role of Agencies', estimatedHours: 5 },
      { id: 'gs3_sec_2', name: 'Challenges to Internal Security', estimatedHours: 8 },
      { id: 'gs3_sec_3', name: 'Terrorism & Counter-terrorism', estimatedHours: 6 },
      { id: 'gs3_sec_4', name: 'Left Wing Extremism', estimatedHours: 5 },
      { id: 'gs3_sec_5', name: 'Cyber Security', estimatedHours: 5 },
      { id: 'gs3_sec_6', name: 'Border Management', estimatedHours: 6 },
    ],
    sources: [
      { type: SOURCE_TYPES.BOOK, name: 'Internal Security - Ashok Kumar', link: '' },
      { type: SOURCE_TYPES.WEBSITE, name: 'MHA Website', link: 'https://mha.gov.in' },
    ],
  },
  {
    id: 'gs3_disaster',
    name: 'Disaster Management',
    paper: 'GS3',
    icon: '🚨',
    estimatedHours: 20,
    difficulty: DIFFICULTY_LEVELS.BASIC,
    priority: PRIORITY_LEVELS.MEDIUM,
    subtopics: [
      { id: 'gs3_dis_1', name: 'Types of Disasters', estimatedHours: 4 },
      { id: 'gs3_dis_2', name: 'Disaster Preparedness', estimatedHours: 4 },
      { id: 'gs3_dis_3', name: 'Mitigation Strategies', estimatedHours: 4 },
      { id: 'gs3_dis_4', name: 'NDMA & Framework', estimatedHours: 4 },
      { id: 'gs3_dis_5', name: 'Case Studies', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.WEBSITE, name: 'NDMA', link: 'https://ndma.gov.in' },
      { type: SOURCE_TYPES.BOOK, name: 'Disaster Management - IGNOU', link: '' },
    ],
  },
];

// GS Paper 4 - Ethics
const GS4_TOPICS = [
  {
    id: 'gs4_ethics',
    name: 'Ethics, Integrity & Aptitude',
    paper: 'GS4',
    icon: '🧭',
    estimatedHours: 60,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'gs4_eth_1', name: 'Ethics & Human Interface', estimatedHours: 8 },
      { id: 'gs4_eth_2', name: 'Attitude & Values', estimatedHours: 6 },
      { id: 'gs4_eth_3', name: 'Emotional Intelligence', estimatedHours: 5 },
      { id: 'gs4_eth_4', name: 'Thinkers & Philosophers', estimatedHours: 8 },
      { id: 'gs4_eth_5', name: 'Public Administration Ethics', estimatedHours: 8 },
      { id: 'gs4_eth_6', name: 'Probity in Governance', estimatedHours: 6 },
      { id: 'gs4_eth_7', name: 'Case Studies', estimatedHours: 15 },
      { id: 'gs4_eth_8', name: 'Corporate Governance', estimatedHours: 4 },
    ],
    sources: [
      { type: SOURCE_TYPES.BOOK, name: 'Ethics, Integrity & Aptitude - Lexicon', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'ARC Reports (2nd)', link: '' },
    ],
  },
];

// Current Affairs
const CURRENT_AFFAIRS = [
  {
    id: 'ca_daily',
    name: 'Daily Current Affairs',
    paper: 'Current Affairs',
    icon: '📰',
    estimatedHours: 2,
    difficulty: DIFFICULTY_LEVELS.BASIC,
    priority: PRIORITY_LEVELS.HIGH,
    isRecurring: true,
    subtopics: [
      { id: 'ca_d_1', name: 'National News', estimatedHours: 0.5 },
      { id: 'ca_d_2', name: 'International News', estimatedHours: 0.5 },
      { id: 'ca_d_3', name: 'Economy Updates', estimatedHours: 0.5 },
      { id: 'ca_d_4', name: 'Science & Tech News', estimatedHours: 0.5 },
    ],
    sources: [
      { type: SOURCE_TYPES.WEBSITE, name: 'The Hindu', link: 'https://thehindu.com' },
      { type: SOURCE_TYPES.WEBSITE, name: 'Indian Express', link: 'https://indianexpress.com' },
      { type: SOURCE_TYPES.WEBSITE, name: 'PIB', link: 'https://pib.gov.in' },
    ],
  },
];

// Optional Subjects (Sample - Political Science)
const OPTIONAL_POLSCI = [
  {
    id: 'opt_ps_paper1',
    name: 'Political Science Paper 1',
    paper: 'Optional',
    optional: 'Political Science',
    icon: '📜',
    estimatedHours: 120,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'opt_ps1_1', name: 'Political Theory', estimatedHours: 30 },
      { id: 'opt_ps1_2', name: 'Indian Government & Politics', estimatedHours: 30 },
      { id: 'opt_ps1_3', name: 'Comparative Politics', estimatedHours: 30 },
      { id: 'opt_ps1_4', name: 'International Relations', estimatedHours: 30 },
    ],
    sources: [
      { type: SOURCE_TYPES.BOOK, name: 'Political Theory - O.P. Gauba', link: '' },
      { type: SOURCE_TYPES.BOOK, name: 'International Politics - Pavneet Singh', link: '' },
    ],
  },
];

// Essay Topics
const ESSAY = [
  {
    id: 'essay_practice',
    name: 'Essay Practice',
    paper: 'Essay',
    icon: '✍️',
    estimatedHours: 40,
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    priority: PRIORITY_LEVELS.HIGH,
    subtopics: [
      { id: 'essay_1', name: 'Philosophical Essays', estimatedHours: 10 },
      { id: 'essay_2', name: 'Socio-Economic Essays', estimatedHours: 10 },
      { id: 'essay_3', name: 'Political Essays', estimatedHours: 10 },
      { id: 'essay_4', name: 'Abstract Essays', estimatedHours: 10 },
    ],
    sources: [
      { type: SOURCE_TYPES.BOOK, name: 'Essay Writing - Forum IAS', link: '' },
    ],
  },
];

// Combine all topics
export const ALL_TOPICS = [
  ...GS1_TOPICS,
  ...GS2_TOPICS,
  ...GS3_TOPICS,
  ...GS4_TOPICS,
  ...CURRENT_AFFAIRS,
  ...ESSAY,
];

export const OPTIONAL_SUBJECTS = {
  'Political Science': OPTIONAL_POLSCI,
  // Add more optional subjects as needed
};

export const PAPER_CATEGORIES = [
  { id: 'GS1', name: 'GS Paper 1', subtitle: 'History, Geography, Culture', color: '#FF6B6B', icon: '📚' },
  { id: 'GS2', name: 'GS Paper 2', subtitle: 'Polity, Governance, IR', color: '#4ECDC4', icon: '⚖️' },
  { id: 'GS3', name: 'GS Paper 3', subtitle: 'Economy, Environment, S&T', color: '#45B7D1', icon: '💰' },
  { id: 'GS4', name: 'GS Paper 4', subtitle: 'Ethics & Aptitude', color: '#96CEB4', icon: '🧭' },
  { id: 'Current Affairs', name: 'Current Affairs', subtitle: 'Daily & Monthly', color: '#FF9F43', icon: '📰' },
  { id: 'Essay', name: 'Essay', subtitle: 'Writing Practice', color: '#A55EEA', icon: '✍️' },
  { id: 'Optional', name: 'Optional Subject', subtitle: 'Your chosen subject', color: '#778CA3', icon: '📖' },
];

export const AVAILABLE_OPTIONALS = [
  'Political Science',
  'Public Administration',
  'History',
  'Geography',
  'Sociology',
  'Philosophy',
  'Psychology',
  'Anthropology',
  'Law',
  'Economics',
  'Commerce',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Literature (Hindi/English)',
  'Management',
  'Medical Science',
  'Agriculture',
  'Animal Husbandry',
  'Civil Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
];

