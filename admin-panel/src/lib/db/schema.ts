import { pgTable, text, serial, timestamp, integer, jsonb, boolean, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============= USERS =============

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    picture: text('picture'),
    provider: varchar('provider', { length: 50 }).notNull(),
    role: varchar('role', { length: 50 }).default('student').notNull(),
    isGuest: boolean('is_guest').default(false),
    isActive: boolean('is_active').default(true),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).default('admin').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============= MAPS =============

export const maps = pgTable('maps', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull(),
    imageUrl: text('image_url').notNull(),
    imagePath: text('image_path'),
    tags: jsonb('tags').$type<string[]>().default([]),
    additionalInfo: jsonb('additional_info').$type<Record<string, any>>(),
    hotspots: jsonb('hotspots').$type<Array<{ x: number; y: number; label: string; description?: string }>>(),
    isPublished: boolean('is_published').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= ARTICLES =============

export const articles = pgTable('articles', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 500 }).notNull(),
    author: varchar('author', { length: 255 }),
    sourceUrl: text('source_url'),
    publishedDate: timestamp('published_date'),
    summary: text('summary'),
    metaDescription: text('meta_description'),
    content: jsonb('content').$type<Array<{ type: string; content: string;[key: string]: any }>>(),
    rawHtml: text('raw_html'),
    images: jsonb('images').$type<Array<{ url: string; alt?: string; caption?: string }>>(),
    gsPaper: varchar('gs_paper', { length: 50 }),
    subject: varchar('subject', { length: 100 }),
    tags: jsonb('tags').$type<string[]>().default([]),
    isPublished: boolean('is_published').default(false),
    scrapedAt: timestamp('scraped_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= ARTICLE MCQs =============

export const articleMcqs = pgTable('article_mcqs', {
    id: serial('id').primaryKey(),
    articleId: integer('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    optionA: text('option_a').notNull(),
    optionB: text('option_b').notNull(),
    optionC: text('option_c').notNull(),
    optionD: text('option_d').notNull(),
    correctAnswer: varchar('correct_answer', { length: 1 }).notNull(), // 'A', 'B', 'C', or 'D'
    explanation: text('explanation'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= PRACTICE QUESTIONS (MANUAL) =============



export const questionSets = pgTable('question_sets', {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    year: integer('year'),
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const practiceQuestions = pgTable('practice_questions', {
    id: serial('id').primaryKey(),
    questionSetId: integer('question_set_id').references(() => questionSets.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    optionA: text('option_a').notNull(),
    optionB: text('option_b').notNull(),
    optionC: text('option_c').notNull(),
    optionD: text('option_d').notNull(),
    correctAnswer: varchar('correct_answer', { length: 1 }).notNull(), // 'A', 'B', 'C', or 'D'
    explanation: text('explanation').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= ACTIVITY LOGS =============

export const activityLogs = pgTable('activity_logs', {
    id: serial('id').primaryKey(),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: integer('entity_id'),
    description: text('description').notNull(),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============= ROADMAP =============

export const roadmapTopics = pgTable('roadmap_topics', {
    id: serial('id').primaryKey(),
    topicId: varchar('topic_id', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    paper: varchar('paper', { length: 50 }).notNull(),
    icon: varchar('icon', { length: 10 }),
    estimatedHours: integer('estimated_hours').notNull(),
    difficulty: varchar('difficulty', { length: 50 }).notNull(),
    priority: varchar('priority', { length: 50 }).notNull(),
    isRecurring: boolean('is_recurring').default(false),
    optional: varchar('optional', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roadmapSubtopics = pgTable('roadmap_subtopics', {
    id: serial('id').primaryKey(),
    subtopicId: varchar('subtopic_id', { length: 100 }).notNull().unique(),
    topicId: integer('topic_id').notNull().references(() => roadmapTopics.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    estimatedHours: integer('estimated_hours').notNull(),
    order: integer('order').notNull(),
});

export const roadmapSources = pgTable('roadmap_sources', {
    id: serial('id').primaryKey(),
    topicId: integer('topic_id').notNull().references(() => roadmapTopics.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    link: text('link'),
    order: integer('order').notNull(),
});

export const userTopicProgress = pgTable('user_topic_progress', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    topicId: integer('topic_id').notNull().references(() => roadmapTopics.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).default('pending').notNull(),
    completedSubtopics: jsonb('completed_subtopics').$type<string[]>().default([]),
    revisionStatus: varchar('revision_status', { length: 50 }).default('not_started'),
    hoursStudied: integer('hours_studied').default(0),
    lastStudied: timestamp('last_studied'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const historyTimelineEvents = pgTable('history_timeline_events', {
    id: serial('id').primaryKey(),
    year: varchar('year', { length: 50 }).notNull(),
    event: text('event').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    details: text('details'),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const visualReferences = pgTable('visual_references', {
    id: serial('id').primaryKey(),
    category: varchar('category', { length: 100 }).notNull(),
    subcategory: varchar('subcategory', { length: 100 }),
    title: varchar('title', { length: 255 }).notNull(),
    data: jsonb('data').notNull(),
    order: integer('order').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= MIND MAPS =============

export const mindMaps = pgTable('mind_maps', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    thumbnail: text('thumbnail'),
    isPublic: boolean('is_public').default(false),
    canvasState: jsonb('canvas_state').$type<{
        zoom: number;
        offsetX: number;
        offsetY: number;
    }>().default({ zoom: 1, offsetX: 0, offsetY: 0 }),
    tags: jsonb('tags').$type<string[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mindMapNodes = pgTable('mind_map_nodes', {
    id: serial('id').primaryKey(),
    mindMapId: integer('mind_map_id').notNull().references(() => mindMaps.id, { onDelete: 'cascade' }),
    nodeId: varchar('node_id', { length: 100 }).notNull(), // Client-generated UUID
    label: varchar('label', { length: 500 }).notNull(),
    x: integer('x').notNull().default(0),
    y: integer('y').notNull().default(0),
    width: integer('width').default(120),
    height: integer('height').default(60),
    color: varchar('color', { length: 20 }).default('#3B82F6'),
    shape: varchar('shape', { length: 20 }).default('rounded'), // rounded, rectangle, circle, diamond
    fontSize: integer('font_size').default(14),
    // Links to other entities
    noteId: integer('note_id'), // Will link to notes table later
    referenceType: varchar('reference_type', { length: 50 }), // 'roadmap_topic', 'timeline_event', 'article', etc.
    referenceId: integer('reference_id'), // ID of the referenced entity
    // Metadata
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mindMapConnections = pgTable('mind_map_connections', {
    id: serial('id').primaryKey(),
    mindMapId: integer('mind_map_id').notNull().references(() => mindMaps.id, { onDelete: 'cascade' }),
    connectionId: varchar('connection_id', { length: 100 }).notNull(), // Client-generated UUID
    sourceNodeId: varchar('source_node_id', { length: 100 }).notNull(),
    targetNodeId: varchar('target_node_id', { length: 100 }).notNull(),
    label: varchar('label', { length: 255 }),
    color: varchar('color', { length: 20 }).default('#94A3B8'),
    strokeWidth: integer('stroke_width').default(2),
    style: varchar('style', { length: 20 }).default('solid'), // solid, dashed, dotted
    animated: boolean('animated').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============= TAGS =============

export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    color: varchar('color', { length: 20 }).default('#6366F1'),
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= NOTES =============

export const notes = pgTable('notes', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    content: jsonb('content').$type<any>(), // Lexical JSON structure
    plainText: text('plain_text'), // For search
    folderId: integer('folder_id'),
    backlinks: jsonb('backlinks').$type<number[]>().default([]), // IDs of notes linking to this
    linkedMindMapNodes: jsonb('linked_mind_map_nodes').$type<string[]>().default([]), // Node IDs
    isPinned: boolean('is_pinned').default(false),
    isArchived: boolean('is_archived').default(false),
    // FTS columns (managed by trigger in database)
    // searchTsv - tsvector for full-text search (not mapped to Drizzle)
    // headings - text[] for heading-only searches (not mapped to Drizzle)
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============= NOTE_TAGS JUNCTION TABLE =============

export const noteTags = pgTable('note_tags', {
    noteId: integer('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============= RELATIONS =============

export const roadmapTopicsRelations = relations(roadmapTopics, ({ many }) => ({
    subtopics: many(roadmapSubtopics),
    sources: many(roadmapSources),
    userProgress: many(userTopicProgress),
}));

export const roadmapSubtopicsRelations = relations(roadmapSubtopics, ({ one }) => ({
    topic: one(roadmapTopics, {
        fields: [roadmapSubtopics.topicId],
        references: [roadmapTopics.id],
    }),
}));

export const roadmapSourcesRelations = relations(roadmapSources, ({ one }) => ({
    topic: one(roadmapTopics, {
        fields: [roadmapSources.topicId],
        references: [roadmapTopics.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    topicProgress: many(userTopicProgress),
}));

export const userTopicProgressRelations = relations(userTopicProgress, ({ one }) => ({
    user: one(users, {
        fields: [userTopicProgress.userId],
        references: [users.id],
    }),
    topic: one(roadmapTopics, {
        fields: [userTopicProgress.topicId],
        references: [roadmapTopics.id],
    }),
}));

// Mind Map Relations
export const mindMapsRelations = relations(mindMaps, ({ one, many }) => ({
    user: one(users, {
        fields: [mindMaps.userId],
        references: [users.id],
    }),
    nodes: many(mindMapNodes),
    connections: many(mindMapConnections),
}));

export const mindMapNodesRelations = relations(mindMapNodes, ({ one }) => ({
    mindMap: one(mindMaps, {
        fields: [mindMapNodes.mindMapId],
        references: [mindMaps.id],
    }),
}));

export const mindMapConnectionsRelations = relations(mindMapConnections, ({ one }) => ({
    mindMap: one(mindMaps, {
        fields: [mindMapConnections.mindMapId],
        references: [mindMaps.id],
    }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
    user: one(users, {
        fields: [notes.userId],
        references: [users.id],
    }),
    noteTags: many(noteTags),
}));

// Tag Relations
export const tagsRelations = relations(tags, ({ many }) => ({
    noteTags: many(noteTags),
}));

// Note Tags Junction Relations
export const noteTagsRelations = relations(noteTags, ({ one }) => ({
    note: one(notes, {
        fields: [noteTags.noteId],
        references: [notes.id],
    }),
    tag: one(tags, {
        fields: [noteTags.tagId],
        references: [tags.id],
    }),
}));

export const questionSetsRelations = relations(questionSets, ({ many }) => ({
    questions: many(practiceQuestions),
}));

export const practiceQuestionsRelations = relations(practiceQuestions, ({ one }) => ({
    questionSet: one(questionSets, {
        fields: [practiceQuestions.questionSetId],
        references: [questionSets.id],
    }),
}));

