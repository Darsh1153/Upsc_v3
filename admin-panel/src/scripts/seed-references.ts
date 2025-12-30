/**
 * Seed script to populate the database with all visual reference data
 * 
 * Run with: npx tsx src/scripts/seed-references.ts
 * 
 * Make sure DATABASE_URL is set or use the default postgres connection
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { visualReferences, historyTimelineEvents } from '../lib/db/schema';

// Direct database connection for seeding
const connectionString = process.env.DATABASE_URL || 'postgres://venkat:1234@localhost:5432/upsc_app';
const client = postgres(connectionString);
const db = drizzle(client);

// ==================== ECONOMY REFERENCE DATA ====================
const ECONOMY_REFERENCE = {
    economicCycle: [
        "Expansion",
        "Peak",
        "Recession",
        "Trough",
        "Recovery"
    ],
    typesOfInflation: [
        "Demand-Pull Inflation",
        "Cost-Push Inflation",
        "Built-In Inflation",
        "Creeping Inflation",
        "Walking Inflation",
        "Galloping Inflation",
        "Hyperinflation",
        "Headline Inflation",
        "Core Inflation"
    ],
    typesOfDeficits: {
        fiscalDeficit: "Excess of total expenditure over total receipts excluding borrowings",
        revenueDeficit: "Difference between revenue expenditure and revenue receipts",
        primaryDeficit: "Fiscal deficit minus interest payments",
        budgetDeficit: "Total expenditure minus total revenue",
        effectiveRevenueDeficit: "Revenue deficit excluding grants for capital creation"
    },
    budgetStructure: {
        revenueBudget: {
            revenueReceipts: ["Tax Revenue", "Non-Tax Revenue"],
            revenueExpenditure: ["Interest Payments", "Salaries", "Subsidies"]
        },
        capitalBudget: {
            capitalReceipts: ["Borrowings", "Disinvestment", "Recovery of Loans"],
            capitalExpenditure: ["Capital Asset Creation", "Loans to States", "Infrastructure Projects"]
        }
    },
    monetaryPolicyTools: {
        CRR: "Percentage of a bank's total deposits to be kept with RBI in cash",
        SLR: "Percentage of deposits to be kept in liquid assets like gold and government securities",
        repoRate: "Rate at which RBI lends short-term funds to commercial banks",
        reverseRepoRate: "Rate at which RBI borrows from commercial banks",
        openMarketOperations: "Purchase and sale of government securities",
        MSF: "Marginal Standing Facility for emergency borrowing by banks"
    },
    fiveYearPlanSummary: [
        { plan: "1st (1951-56)", focus: "Agriculture and irrigation" },
        { plan: "2nd (1956-61)", focus: "Industrialization, heavy industries" },
        { plan: "3rd (1961-66)", focus: "Agriculture + industry; ended due to wars/drought" },
        { plan: "4th (1969-74)", focus: "Growth with stability" },
        { plan: "5th (1974-79)", focus: "Garibi Hatao, poverty removal" },
        { plan: "6th (1980-85)", focus: "Technological advancement" },
        { plan: "7th (1985-90)", focus: "Food, work, productivity" },
        { plan: "8th (1992-97)", focus: "Liberalisation and reforms" },
        { plan: "9th (1997-02)", focus: "Growth with social justice" },
        { plan: "10th (2002-07)", focus: "Reduce poverty, increase employment" },
        { plan: "11th (2007-12)", focus: "Inclusive growth" },
        { plan: "12th (2012-17)", focus: "Faster, sustainable, inclusive growth" }
    ],
    taxStructure: {
        directTaxes: ["Income Tax", "Corporate Tax", "Wealth Tax (abolished)", "Capital Gains Tax"],
        indirectTaxes: ["GST (CGST, SGST, IGST)", "Customs Duty", "Excise Duty (on limited items)"]
    },
    GDP_GNP_NNP_Definitions: {
        GDP: "Gross Domestic Product – Total value of goods and services produced within a country's borders in a year",
        GNP: "Gross National Product – GDP + income earned by residents abroad − income of foreigners within the country",
        NNP: "Net National Product – GNP minus depreciation",
        NDP: "Net Domestic Product – GDP minus depreciation",
        perCapitaIncome: "National income divided by total population"
    }
};

// ==================== POLITY REFERENCE DATA ====================
const POLITY_REFERENCE = {
    constitution: {
        introduction: {
            preamble: {
                keywords: ["Sovereign", "Socialist", "Secular", "Democratic", "Republic"],
                objectives: ["Justice", "Liberty", "Equality", "Fraternity"]
            },
            parts: 25,
            articles: 448,
            schedules: 12
        },
        partsDetail: {
            part1: "Union and its Territory",
            part2: "Citizenship",
            part3: "Fundamental Rights",
            part4: "Directive Principles of State Policy",
            part4A: "Fundamental Duties",
            part5: "Union Government",
            part6: "State Government",
            part7: "Repealed",
            part8: "Union Territories",
            part9: "Panchayats",
            part9A: "Municipalities",
            part9B: "Co-operative Societies",
            part10: "Scheduled Areas and Tribes",
            part11: "Centre-State Relations",
            part12: "Finance, Property, Contracts",
            part13: "Trade and Commerce",
            part14: "Services under Union and States",
            part14A: "Tribunals",
            part15: "Elections",
            part16: "Special Provisions for SC/ST/OBC",
            part17: "Official Language",
            part18: "Emergency Provisions",
            part19: "Miscellaneous",
            part20: "Amendment of Constitution",
            part21: "Temporary and Transitional Provisions",
            part22: "Short Title, Commencement, Repeals"
        }
    },
    unionGovernment: {
        president: {
            article: "Article 52-62",
            election: "Indirect — Electoral College",
            term: "5 years",
            powers: {
                executive: ["Appoints PM", "Appoints Ministers", "Appoints Chief Justice & Judges", "Appoints Governors"],
                legislative: ["Summons Parliament", "Dissolves Lok Sabha", "Nominates members"],
                judicial: ["Clemency powers under Article 72"],
                emergency: ["National Emergency", "State Emergency", "Financial Emergency"]
            }
        },
        vicePresident: {
            article: "Article 63-71",
            role: "Ex-officio Chairman of Rajya Sabha",
            election: "Electoral College — MPs only"
        },
        councilOfMinisters: {
            headedBy: "Prime Minister",
            responsibility: "Collectively responsible to Lok Sabha",
            limit: "15% of Lok Sabha strength"
        },
        primeMinister: {
            appointment: "Appointed by President, usually leader of majority",
            powers: ["Heads Council of Ministers", "Leader of Lok Sabha", "Advises President", "Controls administration"]
        }
    },
    parliament: {
        lokSabha: {
            article: "79-122",
            strength: { maximum: 552, current: 543 },
            term: "5 years",
            speaker: {
                role: "Presiding officer",
                powers: ["Maintains order", "Decides money bills", "Controls parliamentary committees"]
            },
            specialPowers: ["Money bills", "No-confidence motion"]
        },
        rajyaSabha: {
            strength: { maximum: 250, current: 245 },
            permanentBody: true,
            retirement: "1/3 members retire every 2 years",
            chairman: {
                exOfficio: "Vice President of India",
                role: "Presiding officer",
                powers: ["Presides over proceedings", "Decides points of order", "Can suspend members"]
            },
            powers: {
                legislative: ["Equal with Lok Sabha except money bills", "Participates in constitutional amendments"],
                financial: ["Can delay money bill for 14 days"],
                federal: ["Can allow Parliament to legislate on State List (Art 249)", "Can create All India Services (Art 312)"],
                judicial: ["Participates in impeachment of President", "Removal of judges"]
            }
        }
    },
    judiciary: {
        supremeCourt: {
            articles: "124-147",
            established: "1950",
            composition: { chiefJustice: "CJI", maxJudges: 34 },
            jurisdiction: {
                original: ["Centre-state disputes", "Fundamental rights"],
                appellate: ["Civil", "Criminal", "SLP (Art 136)"],
                advisory: ["President's reference (Art 143)"],
                writs: ["Habeas Corpus", "Mandamus", "Prohibition", "Certiorari", "Quo Warranto"]
            }
        },
        highCourt: {
            articles: "214-231",
            jurisdiction: ["Original", "Appellate", "Supervisory", "Writ jurisdiction (Art 226)"]
        },
        subordinateCourts: {
            types: ["District Court", "Sessions Court", "Civil Court", "Criminal Court"],
            controlledBy: "High Court"
        }
    },
    stateGovernment: {
        governor: {
            articles: "153-162",
            appointment: "By President",
            term: "5 years",
            powers: {
                executive: ["Appoints CM", "Appoints ministers"],
                legislative: ["Summons Assembly", "Dissolves Assembly"],
                judicial: ["Pardoning for state offenses"],
                emergency: ["Can recommend President's Rule"]
            }
        },
        chiefMinister: {
            appointment: "Appointed by Governor",
            role: "Real executive authority"
        },
        stateLegislature: {
            types: ["Unicameral", "Bicameral"],
            vidhanSabha: { term: "5 years", specialPowers: ["Money bills", "No-confidence"] },
            vidhanParishad: { permanent: true, retirement: "1/3 every 2 years" }
        }
    },
    localGovernment: {
        panchayatiRaj: {
            amendment: "73rd Amendment",
            levels: ["Gram Panchayat", "Panchayat Samiti", "Zila Parishad"],
            reservations: ["SC", "ST", "Women 33%", "OBC (state decided)"],
            term: "5 years"
        },
        municipalities: {
            amendment: "74th Amendment",
            types: ["Municipal Corporation", "Municipal Council", "Nagar Panchayat"],
            heads: { mayor: "Political head", commissioner: "Administrative head" }
        }
    }
};

// ==================== GEOGRAPHY REFERENCE DATA ====================
const GEOGRAPHY_REFERENCE = {
    indianPhysicalFeatures: {
        himalayas: ["Trans Himalayas", "Greater Himalayas", "Lesser Himalayas", "Shivaliks"],
        northernPlains: ["Punjab Plains", "Ganga Plains", "Brahmaputra Plains"],
        peninsularPlateau: ["Central Highlands", "Deccan Plateau"],
        coastalPlains: ["Eastern Coastal Plains", "Western Coastal Plains"],
        islands: ["Andaman & Nicobar Islands", "Lakshadweep Islands"]
    },
    majorRivers: {
        himalayanRivers: ["Indus", "Jhelum", "Chenab", "Ravi", "Beas", "Sutlej", "Ganga", "Yamuna", "Ghaghara", "Gandak", "Kosi", "Brahmaputra"],
        peninsularRivers: ["Godavari", "Krishna", "Kaveri", "Narmada", "Tapi", "Mahanadi", "Sabarmati", "Luni"]
    },
    mountainRanges: [
        "Himalayas", "Aravalli Range", "Vindhya Range", "Satpura Range",
        "Western Ghats", "Eastern Ghats", "Pir Panjal", "Zanskar Range", "Karakoram Range"
    ],
    plateaus: ["Deccan Plateau", "Chota Nagpur Plateau", "Malwa Plateau", "Bundelkhand Plateau", "Meghalaya Plateau"],
    soilTypes: [
        "Alluvial Soil", "Black Soil", "Red Soil", "Laterite Soil",
        "Arid Soil", "Forest and Mountain Soil", "Peaty and Marshy Soil"
    ],
    climateTypes: [
        "Tropical Wet", "Tropical Wet and Dry", "Semi-Arid",
        "Arid", "Subtropical Humid", "Montane"
    ],
    naturalVegetation: [
        "Tropical Evergreen Forest", "Tropical Deciduous Forest",
        "Thorn Forest", "Montane Forest", "Mangrove Forest"
    ],
    nationalParksTop40: [
        "Jim Corbett", "Kaziranga", "Ranthambore", "Gir", "Sundarbans",
        "Bandipur", "Nagarhole", "Periyar", "Bandhavgarh", "Kanha"
    ],
    worldMajorPhysicalFeatures: {
        mountainRanges: ["Andes", "Rockies", "Alps", "Himalayas", "Atlas Mountains", "Ural Mountains"],
        rivers: ["Nile", "Amazon", "Yangtze", "Mississippi", "Danube", "Volga"],
        deserts: ["Sahara", "Gobi", "Kalahari", "Arabian Desert", "Great Victoria"],
        plateaus: ["Tibetan Plateau", "Columbia Plateau", "Brazilian Plateau", "Deccan Plateau"],
        oceans: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern"]
    }
};

// ==================== ENVIRONMENT REFERENCE DATA ====================
const ENVIRONMENT_REFERENCE = {
    biodiversityHotspots: {
        india: ["Himalaya", "Indo-Burma", "Western Ghats & Sri Lanka", "Sundaland (Nicobar Islands)"],
        world: [
            "Madagascar & Indian Ocean Islands", "Atlantic Forest", "Tropical Andes",
            "Mesoamerica", "Cerrado", "Mediterranean Basin", "Japan",
            "California Floristic Province", "New Zealand", "Philippines"
        ]
    },
    protectedAreaCategories: {
        india: [
            "National Parks", "Wildlife Sanctuaries", "Biosphere Reserves",
            "Conservation Reserves", "Community Reserves",
            "Tiger Reserves (Project Tiger)", "Elephant Reserves (Project Elephant)"
        ],
        iucnCategories: {
            Ia: "Strict Nature Reserve",
            Ib: "Wilderness Area",
            II: "National Park",
            III: "Natural Monument",
            IV: "Habitat/Species Management Area",
            V: "Protected Landscape/Seascape",
            VI: "Protected area with sustainable use"
        }
    },
    foodChainFoodWeb: {
        foodChain: "Linear sequence of organisms showing who eats whom – producers → primary consumers → secondary → tertiary consumers",
        foodWeb: "Interconnected network of multiple food chains showing complex feeding relationships within an ecosystem"
    },
    biogeochemicalCycles: {
        carbonCycle: "Movement of carbon through atmosphere, plants (photosynthesis), animals, oceans, soil, and back through respiration, decomposition, and combustion",
        nitrogenCycle: "Process involving nitrogen fixation, nitrification, assimilation, ammonification, and denitrification converting atmospheric nitrogen into usable forms and back"
    },
    pollutionTypes: [
        "Air Pollution", "Water Pollution", "Soil Pollution", "Noise Pollution",
        "Thermal Pollution", "Radioactive Pollution", "Light Pollution",
        "Plastic Pollution", "E-Waste Pollution"
    ],
    majorEnvironmentalTreaties: [
        "Paris Agreement (2015)", "Kyoto Protocol (1997)", "Montreal Protocol (1987)",
        "Stockholm Convention (2001)", "Basel Convention (1989)",
        "Convention on Biological Diversity (CBD, 1992)",
        "CITES – Convention on International Trade in Endangered Species (1973)",
        "UNFCCC – Climate Convention (1992)", "Ramsar Convention on Wetlands (1971)",
        "Bonn Convention (CMS, 1979)"
    ]
};

// ==================== SCIENCE & TECH REFERENCE DATA ====================
const SCIENCE_TECH_REFERENCE = {
    isroMissions: [
        { name: "Aryabhata", year: 1975, type: "Satellite", description: "India's first satellite" },
        { name: "Chandrayaan-1", year: 2008, type: "Lunar Mission", description: "First lunar mission, discovered water on Moon" },
        { name: "Mars Orbiter Mission", year: 2013, type: "Interplanetary", description: "Mangalyaan - first Asian interplanetary mission" },
        { name: "Chandrayaan-3", year: 2023, type: "Lunar Mission", description: "Successful soft landing on Moon's south pole" },
        { name: "Aditya-L1", year: 2023, type: "Solar Mission", description: "India's first solar observation mission" }
    ],
    launchVehicles: {
        PSLV: { fullName: "Polar Satellite Launch Vehicle", stages: 4, firstLaunch: 1993 },
        GSLV: { fullName: "Geosynchronous Satellite Launch Vehicle", stages: 3, firstLaunch: 2001 },
        GSLV_Mk_III: { fullName: "GSLV Mark III (LVM3)", stages: 3, firstLaunch: 2017 },
        SSLV: { fullName: "Small Satellite Launch Vehicle", stages: 3, firstLaunch: 2022 }
    },
    dnaRnaBasics: {
        DNA: {
            fullName: "Deoxyribonucleic Acid",
            structure: "Double helix",
            bases: ["Adenine", "Thymine", "Guanine", "Cytosine"],
            function: "Stores genetic information"
        },
        RNA: {
            fullName: "Ribonucleic Acid",
            structure: "Single strand",
            bases: ["Adenine", "Uracil", "Guanine", "Cytosine"],
            types: ["mRNA", "tRNA", "rRNA"]
        }
    },
    indianScientists: [
        { name: "C.V. Raman", field: "Physics", achievement: "Raman Effect - Nobel Prize 1930" },
        { name: "Homi J. Bhabha", field: "Nuclear Physics", achievement: "Father of Indian Nuclear Program" },
        { name: "Vikram Sarabhai", field: "Space Science", achievement: "Father of Indian Space Program" },
        { name: "A.P.J. Abdul Kalam", field: "Aerospace", achievement: "Missile Man of India" },
        { name: "Srinivasa Ramanujan", field: "Mathematics", achievement: "Contributed to number theory" }
    ],
    defenseTechnology: {
        missiles: [
            { name: "Prithvi", type: "Surface-to-Surface", range: "150-350 km" },
            { name: "Agni Series", type: "Ballistic", range: "700-5000+ km" },
            { name: "BrahMos", type: "Cruise", range: "290-450 km" }
        ]
    },
    emergingTechnologies: [
        { name: "Artificial Intelligence", description: "Machine learning for automation" },
        { name: "Blockchain", description: "Decentralized ledger technology" },
        { name: "Quantum Computing", description: "Computing using quantum mechanics" },
        { name: "5G Technology", description: "Fifth generation mobile network" }
    ]
};

// ==================== INDIAN HISTORY TIMELINE ====================
const INDIAN_HISTORY_TIMELINE = [
    { year: "500000 BCE", event: "Early Paleolithic Period begins", category: "Prehistoric", details: "Stone tools and evidence of early human activity in Indian subcontinent." },
    { year: "3300 BCE", event: "Indus Valley Civilization begins", category: "Ancient", details: "Early phase of urbanization in northwestern Indian subcontinent." },
    { year: "2600 BCE", event: "Mature Harappan Period begins", category: "Ancient", details: "Peak of Indus Valley Civilization. Major cities: Harappa, Mohenjo-daro." },
    { year: "1500 BCE", event: "Early Vedic Period begins", category: "Ancient", details: "Composition of Rigveda. Indo-Aryan settlement." },
    { year: "563 BCE", event: "Birth of Gautama Buddha", category: "Ancient", details: "Founder of Buddhism born in Lumbini." },
    { year: "540 BCE", event: "Birth of Mahavira", category: "Ancient", details: "24th Tirthankara of Jainism." },
    { year: "321 BCE", event: "Mauryan Empire founded", category: "Ancient", details: "Chandragupta Maurya establishes the empire with Chanakya's guidance." },
    { year: "268 BCE", event: "Ashoka becomes Emperor", category: "Ancient", details: "Greatest Mauryan ruler, embraced Buddhism after Kalinga War." },
    { year: "320 CE", event: "Gupta Empire begins", category: "Ancient", details: "Golden Age of India begins under Chandragupta I." },
    { year: "1206", event: "Delhi Sultanate established", category: "Medieval", details: "Qutb-ud-din Aibak founds the Slave Dynasty." },
    { year: "1526", event: "Mughal Empire begins", category: "Medieval", details: "Babur defeats Ibrahim Lodi at First Battle of Panipat." },
    { year: "1556", event: "Akbar becomes Emperor", category: "Medieval", details: "Greatest Mughal ruler, known for religious tolerance." },
    { year: "1600", event: "East India Company formed", category: "Modern", details: "British trading company that eventually colonized India." },
    { year: "1857", event: "First War of Independence", category: "Modern", details: "Major uprising against British rule, also called Sepoy Mutiny." },
    { year: "1885", event: "Indian National Congress founded", category: "Modern", details: "First modern nationalist movement organization." },
    { year: "1920", event: "Non-Cooperation Movement", category: "Modern", details: "Gandhi's first major civil disobedience campaign." },
    { year: "1942", event: "Quit India Movement", category: "Modern", details: "Final major push for independence under Gandhi." },
    { year: "1947", event: "Indian Independence", category: "Modern", details: "India gains independence on August 15, 1947." },
    { year: "1950", event: "Constitution comes into effect", category: "Modern", details: "India becomes a Republic on January 26, 1950." }
];

// ==================== WORLD HISTORY TIMELINE ====================
const WORLD_HISTORY_TIMELINE = [
    { year: "3500 BCE", event: "Rise of Mesopotamian Civilization", category: "Ancient Civilizations", details: "Sumerians establish the first known civilization." },
    { year: "3100 BCE", event: "Unification of Ancient Egypt", category: "Ancient Civilizations", details: "King Narmer unifies Upper and Lower Egypt." },
    { year: "508 BCE", event: "Athenian Democracy Established", category: "Ancient Civilizations", details: "Foundation for Western democratic governance." },
    { year: "336 BCE", event: "Alexander the Great Ascends", category: "Ancient Civilizations", details: "Creates empire from Greece to India." },
    { year: "27 BCE", event: "Roman Empire begins", category: "Ancient Civilizations", details: "Augustus becomes first Roman Emperor." },
    { year: "476 CE", event: "Fall of Western Roman Empire", category: "Medieval Europe", details: "Marks the end of ancient history." },
    { year: "1347", event: "Black Death begins", category: "Medieval Europe", details: "Plague kills 30-60% of European population." },
    { year: "1453", event: "Fall of Constantinople", category: "Medieval Europe", details: "Ottoman conquest ends Byzantine Empire." },
    { year: "1492", event: "Columbus reaches Americas", category: "Renaissance", details: "Beginning of European colonization of Americas." },
    { year: "1517", event: "Protestant Reformation begins", category: "Renaissance", details: "Martin Luther posts 95 Theses." },
    { year: "1789", event: "French Revolution begins", category: "Enlightenment", details: "Overthrow of French monarchy, rise of democracy ideals." },
    { year: "1776", event: "American Independence", category: "Enlightenment", details: "Declaration of Independence signed." },
    { year: "1769", event: "Industrial Revolution begins", category: "Industrial Revolution", details: "Steam engine patented by James Watt." },
    { year: "1914", event: "World War I begins", category: "World War", details: "Great War triggered by assassination of Archduke Franz Ferdinand." },
    { year: "1939", event: "World War II begins", category: "World War", details: "Germany invades Poland, starting deadliest conflict in history." },
    { year: "1945", event: "United Nations founded", category: "Modern Era", details: "International organization for peace and cooperation." },
    { year: "1947", event: "Cold War begins", category: "Cold War", details: "Start of ideological conflict between USA and USSR." },
    { year: "1991", event: "Soviet Union dissolves", category: "Cold War", details: "End of the Cold War era." },
    { year: "2001", event: "September 11 attacks", category: "Modern Era", details: "Terrorist attacks change global security paradigm." }
];

async function seedReferences() {
    console.log('🌱 Starting visual references seeding...\n');

    try {
        // Seed Visual References
        console.log('📚 Seeding visual references...');

        const referenceData = [
            { category: 'economy', title: 'economyReference', data: ECONOMY_REFERENCE, order: 1 },
            { category: 'polity', title: 'polityReference', data: POLITY_REFERENCE, order: 1 },
            { category: 'geography', title: 'geographyReference', data: GEOGRAPHY_REFERENCE, order: 1 },
            { category: 'environment', title: 'environmentReference', data: ENVIRONMENT_REFERENCE, order: 1 },
            { category: 'scienceTech', title: 'scienceTechReference', data: SCIENCE_TECH_REFERENCE, order: 1 },
        ];

        for (const ref of referenceData) {
            await db.insert(visualReferences).values(ref).onConflictDoNothing();
            console.log(`  ✓ ${ref.category} reference`);
        }

        // Seed Indian History Timeline
        console.log('\n📜 Seeding Indian history timeline...');
        for (let i = 0; i < INDIAN_HISTORY_TIMELINE.length; i++) {
            const event = INDIAN_HISTORY_TIMELINE[i];
            await db.insert(historyTimelineEvents).values({
                year: event.year,
                event: event.event,
                category: `indian_${event.category.toLowerCase()}`,
                details: event.details,
                order: i,
            }).onConflictDoNothing();
        }
        console.log(`  ✓ ${INDIAN_HISTORY_TIMELINE.length} Indian history events`);

        // Seed World History Timeline
        console.log('\n🌍 Seeding World history timeline...');
        for (let i = 0; i < WORLD_HISTORY_TIMELINE.length; i++) {
            const event = WORLD_HISTORY_TIMELINE[i];
            await db.insert(historyTimelineEvents).values({
                year: event.year,
                event: event.event,
                category: `world_${event.category.toLowerCase().replace(/ /g, '_')}`,
                details: event.details,
                order: INDIAN_HISTORY_TIMELINE.length + i,
            }).onConflictDoNothing();
        }
        console.log(`  ✓ ${WORLD_HISTORY_TIMELINE.length} World history events`);

        console.log('\n✅ Seeding completed successfully!');
    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        await client.end();
        process.exit(1);
    }

    await client.end();
    process.exit(0);
}

seedReferences();
