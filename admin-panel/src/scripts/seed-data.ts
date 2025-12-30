/**
 * Seed script to populate the database with initial roadmap and reference data
 * 
 * Run with: npx tsx src/scripts/seed-data.ts
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { roadmapTopics, roadmapSubtopics, roadmapSources, visualReferences, historyTimelineEvents } from '../lib/db/schema';

// ========== ROADMAP DATA ==========
const DIFFICULTY_LEVELS = {
    BASIC: 'Basic',
    MODERATE: 'Moderate',
    ADVANCED: 'Advanced',
};

const PRIORITY_LEVELS = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
};

const SOURCE_TYPES = {
    NCERT: 'NCERT',
    BOOK: 'Book',
    WEBSITE: 'Website',
    YOUTUBE: 'YouTube',
    PDF: 'PDF',
    NOTES: 'Notes',
    CUSTOM: 'Custom',
};

const ALL_TOPICS = [
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
        ],
        sources: [
            { type: SOURCE_TYPES.NCERT, name: 'Class 6 - Our Pasts I', link: '' },
            { type: SOURCE_TYPES.NCERT, name: 'Class 11 - Themes in World History', link: '' },
            { type: SOURCE_TYPES.BOOK, name: "India's Ancient Past - R.S. Sharma", link: '' },
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

// ========== REFERENCE DATA ==========
const ECONOMY_REFERENCE = {
    category: 'economy',
    items: [
        {
            title: 'economicCycle',
            data: ['Expansion', 'Peak', 'Recession', 'Trough', 'Recovery'],
        },
        {
            title: 'typesOfInflation',
            data: [
                'Demand-Pull Inflation',
                'Cost-Push Inflation',
                'Built-In Inflation',
                'Creeping Inflation',
                'Walking Inflation',
                'Galloping Inflation',
                'Hyperinflation',
                'Headline Inflation',
                'Core Inflation',
            ],
        },
        {
            title: 'typesOfDeficits',
            data: {
                fiscalDeficit: 'Excess of total expenditure over total receipts excluding borrowings',
                revenueDeficit: 'Difference between revenue expenditure and revenue receipts',
                primaryDeficit: 'Fiscal deficit minus interest payments',
                budgetDeficit: 'Total expenditure minus total revenue',
                effectiveRevenueDeficit: 'Revenue deficit excluding grants for capital creation',
            },
        },
        {
            title: 'monetaryPolicyTools',
            data: {
                CRR: 'Percentage of a bank\'s total deposits to be kept with RBI in cash',
                SLR: 'Percentage of deposits to be kept in liquid assets like gold and government securities',
                repoRate: 'Rate at which RBI lends short-term funds to commercial banks',
                reverseRepoRate: 'Rate at which RBI borrows from commercial banks',
                openMarketOperations: 'Purchase and sale of government securities',
                MSF: 'Marginal Standing Facility for emergency borrowing by banks',
            },
        },
    ],
};

const POLITY_REFERENCE = {
    category: 'polity',
    items: [
        {
            title: 'constitutionIntro',
            data: {
                preamble: {
                    keywords: ['Sovereign', 'Socialist', 'Secular', 'Democratic', 'Republic'],
                    objectives: ['Justice', 'Liberty', 'Equality', 'Fraternity'],
                },
                parts: 25,
                articles: 448,
                schedules: 12,
            },
        },
        {
            title: 'president',
            data: {
                article: 'Article 52-62',
                election: 'Indirect — Electoral College',
                term: '5 years',
                powers: {
                    executive: ['Appoints PM', 'Appoints Ministers', 'Appoints Chief Justice & Judges', 'Appoints Governors'],
                    legislative: ['Summons Parliament', 'Dissolves Lok Sabha', 'Nominates members'],
                    judicial: ['Clemency powers under Article 72'],
                    emergency: ['National Emergency', 'State Emergency', 'Financial Emergency'],
                },
            },
        },
        {
            title: 'parliament',
            data: {
                lokSabha: {
                    strength: { maximum: 552, current: 543 },
                    term: '5 years',
                    specialPowers: ['Money bills', 'No-confidence motion'],
                },
                rajyaSabha: {
                    strength: { maximum: 250, current: 245 },
                    permanentBody: true,
                    retirement: '1/3 members retire every 2 years',
                },
            },
        },
    ],
};

const GEOGRAPHY_REFERENCE = {
    category: 'geography',
    items: [
        {
            title: 'indianPhysicalFeatures',
            data: {
                himalayas: ['Trans Himalayas', 'Greater Himalayas', 'Lesser Himalayas', 'Shivaliks'],
                northernPlains: ['Punjab Plains', 'Ganga Plains', 'Brahmaputra Plains'],
                peninsularPlateau: ['Central Highlands', 'Deccan Plateau'],
                coastalPlains: ['Eastern Coastal Plains', 'Western Coastal Plains'],
                islands: ['Andaman & Nicobar Islands', 'Lakshadweep Islands'],
            },
        },
        {
            title: 'majorRivers',
            data: {
                himalayanRivers: ['Indus', 'Jhelum', 'Chenab', 'Ravi', 'Beas', 'Sutlej', 'Ganga', 'Yamuna', 'Brahmaputra'],
                peninsularRivers: ['Godavari', 'Krishna', 'Kaveri', 'Narmada', 'Tapi', 'Mahanadi'],
            },
        },
        {
            title: 'soilTypes',
            data: ['Alluvial Soil', 'Black Soil', 'Red Soil', 'Laterite Soil', 'Arid Soil', 'Forest and Mountain Soil', 'Peaty and Marshy Soil'],
        },
    ],
};

const ENVIRONMENT_REFERENCE = {
    category: 'environment',
    items: [
        {
            title: 'biodiversityHotspots',
            data: {
                india: ['Himalaya', 'Indo-Burma', 'Western Ghats & Sri Lanka', 'Sundaland (Nicobar Islands)'],
                world: ['Madagascar', 'Atlantic Forest', 'Tropical Andes', 'Mesoamerica', 'Mediterranean Basin'],
            },
        },
        {
            title: 'protectedAreaCategories',
            data: {
                india: ['National Parks', 'Wildlife Sanctuaries', 'Biosphere Reserves', 'Conservation Reserves', 'Community Reserves', 'Tiger Reserves', 'Elephant Reserves'],
                iucnCategories: {
                    Ia: 'Strict Nature Reserve',
                    Ib: 'Wilderness Area',
                    II: 'National Park',
                    III: 'Natural Monument',
                    IV: 'Habitat/Species Management Area',
                    V: 'Protected Landscape/Seascape',
                    VI: 'Protected area with sustainable use',
                },
            },
        },
        {
            title: 'pollutionTypes',
            data: ['Air Pollution', 'Water Pollution', 'Soil Pollution', 'Noise Pollution', 'Thermal Pollution', 'Radioactive Pollution', 'Light Pollution', 'Plastic Pollution', 'E-Waste Pollution'],
        },
        {
            title: 'majorEnvironmentalTreaties',
            data: [
                'Paris Agreement (2015)',
                'Kyoto Protocol (1997)',
                'Montreal Protocol (1987)',
                'Stockholm Convention (2001)',
                'Convention on Biological Diversity (1992)',
                'CITES (1973)',
                'Ramsar Convention on Wetlands (1971)',
            ],
        },
    ],
};

const SCIENCE_TECH_REFERENCE = {
    category: 'science_tech',
    items: [
        {
            title: 'isroMissions',
            data: [
                { name: 'Aryabhata', year: 1975, type: 'Satellite', description: "India's first satellite" },
                { name: 'Chandrayaan-1', year: 2008, type: 'Lunar Mission', description: 'First lunar mission, discovered water on Moon' },
                { name: 'Mars Orbiter Mission', year: 2013, type: 'Interplanetary', description: 'First Asian interplanetary mission' },
                { name: 'Chandrayaan-3', year: 2023, type: 'Lunar Mission', description: "Successful soft landing on Moon's south pole" },
                { name: 'Aditya-L1', year: 2023, type: 'Solar Mission', description: "India's first solar observation mission" },
            ],
        },
        {
            title: 'indianScientists',
            data: [
                { name: 'C.V. Raman', field: 'Physics', achievement: 'Raman Effect - Nobel Prize 1930' },
                { name: 'Homi J. Bhabha', field: 'Nuclear Physics', achievement: 'Father of Indian Nuclear Program' },
                { name: 'Vikram Sarabhai', field: 'Space Science', achievement: 'Father of Indian Space Program' },
                { name: 'A.P.J. Abdul Kalam', field: 'Aerospace', achievement: 'Missile Man of India' },
                { name: 'Srinivasa Ramanujan', field: 'Mathematics', achievement: 'Number theory, infinite series' },
            ],
        },
    ],
};

// Sample timeline events (first 20)
const HISTORY_TIMELINE_EVENTS = [
    { year: '3300 BCE', event: 'Indus Valley Civilization begins (Early Harappan)', category: 'Ancient', details: 'Early phase of urbanization in northwestern Indian subcontinent.' },
    { year: '2600 BCE', event: 'Mature Harappan Period begins', category: 'Ancient', details: 'Peak of Indus Valley Civilization. Major cities: Harappa, Mohenjo-daro.' },
    { year: '1500 BCE', event: 'Early Vedic Period begins', category: 'Ancient', details: 'Composition of Rigveda. Indo-Aryan migration/settlement.' },
    { year: '563 BCE', event: 'Birth of Gautama Buddha', category: 'Ancient', details: 'Founder of Buddhism born in Lumbini.' },
    { year: '321 BCE', event: 'Chandragupta Maurya establishes Mauryan Empire', category: 'Ancient', details: 'Founds Mauryan Empire with Chanakya.' },
    { year: '261 BCE', event: 'Kalinga War', category: 'Ancient', details: 'Ashoka conquers Kalinga, converts to Buddhism.' },
    { year: '319 CE', event: 'Gupta Empire founded', category: 'Ancient', details: 'Golden Age of India begins.' },
    { year: '1192 CE', event: 'Second Battle of Tarain', category: 'Medieval', details: 'Muhammad Ghori defeats Prithviraj Chauhan.' },
    { year: '1206 CE', event: 'Delhi Sultanate established', category: 'Medieval', details: 'Qutb-ud-din Aibak becomes first Sultan.' },
    { year: '1526 CE', event: 'First Battle of Panipat - Mughal Empire founded', category: 'Medieval', details: 'Babur defeats Ibrahim Lodi.' },
    { year: '1600 CE', event: 'English East India Company chartered', category: 'Medieval', details: 'Queen Elizabeth I grants charter.' },
    { year: '1757 CE', event: 'Battle of Plassey', category: 'Modern', details: 'Robert Clive defeats Siraj-ud-Daulah. British political control begins.' },
    { year: '1857 CE', event: 'Revolt of 1857', category: 'Modern', details: 'First War of Independence.' },
    { year: '1885 CE', event: 'Indian National Congress founded', category: 'Modern', details: 'First session in Bombay.' },
    { year: '1919 CE', event: 'Jallianwala Bagh Massacre', category: 'Modern', details: 'General Dyer orders firing on peaceful gathering.' },
    { year: '1930 CE', event: 'Dandi March (Salt Satyagraha)', category: 'Modern', details: 'Gandhi walks to Dandi to break salt law.' },
    { year: '1942 CE', event: 'Quit India Movement', category: 'Modern', details: "Gandhi gives 'Do or Die' call." },
    { year: '1947 CE', event: 'Independence Day - August 15, 1947', category: 'Modern', details: 'India gains independence at midnight.' },
];

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // Seed Roadmap Topics
        console.log('📚 Seeding roadmap topics...');
        for (const topic of ALL_TOPICS) {
            const [newTopic] = await db
                .insert(roadmapTopics)
                .values({
                    topicId: topic.id,
                    name: topic.name,
                    paper: topic.paper,
                    icon: topic.icon,
                    estimatedHours: topic.estimatedHours,
                    difficulty: topic.difficulty,
                    priority: topic.priority,
                    isRecurring: false,
                })
                .onConflictDoNothing()
                .returning();

            if (newTopic && topic.subtopics) {
                await db.insert(roadmapSubtopics).values(
                    topic.subtopics.map((st, index) => ({
                        subtopicId: st.id,
                        topicId: newTopic.id,
                        name: st.name,
                        estimatedHours: st.estimatedHours,
                        order: index,
                    }))
                ).onConflictDoNothing();
            }

            if (newTopic && topic.sources) {
                await db.insert(roadmapSources).values(
                    topic.sources.map((src, index) => ({
                        topicId: newTopic.id,
                        type: src.type,
                        name: src.name,
                        link: src.link || null,
                        order: index,
                    }))
                );
            }

            console.log(`  ✓ ${topic.name}`);
        }

        // Seed Visual References
        console.log('\n📖 Seeding visual references...');
        const allRefs = [ECONOMY_REFERENCE, POLITY_REFERENCE, GEOGRAPHY_REFERENCE, ENVIRONMENT_REFERENCE, SCIENCE_TECH_REFERENCE];
        for (const refCategory of allRefs) {
            for (const item of refCategory.items) {
                await db.insert(visualReferences).values({
                    category: refCategory.category,
                    title: item.title,
                    data: item.data,
                    order: refCategory.items.indexOf(item),
                } as any).onConflictDoNothing();
            }
            console.log(`  ✓ ${refCategory.category}`);
        }

        // Seed Timeline Events
        console.log('\n📅 Seeding history timeline...');
        for (let i = 0; i < HISTORY_TIMELINE_EVENTS.length; i++) {
            const event = HISTORY_TIMELINE_EVENTS[i];
            await db.insert(historyTimelineEvents).values({
                year: event.year,
                event: event.event,
                category: event.category,
                details: event.details,
                order: i,
            }).onConflictDoNothing();
        }
        console.log(`  ✓ ${HISTORY_TIMELINE_EVENTS.length} events`);

        console.log('\n✅ Database seeded successfully!');
    } catch (error) {
        console.error('❌ Seed error:', error);
        throw error;
    }
}

// Run the seed
seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

