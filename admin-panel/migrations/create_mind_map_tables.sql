-- Mind Map Tables Migration
-- Run this SQL in your PostgreSQL database (upsc_app)

-- Mind Maps Table
CREATE TABLE IF NOT EXISTS mind_maps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    canvas_state JSONB DEFAULT '{"zoom": 1, "offsetX": 0, "offsetY": 0}'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Mind Map Nodes Table
CREATE TABLE IF NOT EXISTS mind_map_nodes (
    id SERIAL PRIMARY KEY,
    mind_map_id INTEGER NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    label VARCHAR(500) NOT NULL,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    width INTEGER DEFAULT 120,
    height INTEGER DEFAULT 60,
    color VARCHAR(20) DEFAULT '#3B82F6',
    shape VARCHAR(20) DEFAULT 'rounded',
    font_size INTEGER DEFAULT 14,
    note_id INTEGER,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Mind Map Connections Table
CREATE TABLE IF NOT EXISTS mind_map_connections (
    id SERIAL PRIMARY KEY,
    mind_map_id INTEGER NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
    connection_id VARCHAR(100) NOT NULL,
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    color VARCHAR(20) DEFAULT '#94A3B8',
    stroke_width INTEGER DEFAULT 2,
    style VARCHAR(20) DEFAULT 'solid',
    animated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_mind_map_id ON mind_map_nodes(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_node_id ON mind_map_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_connections_mind_map_id ON mind_map_connections(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_connections_source ON mind_map_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_connections_target ON mind_map_connections(target_node_id);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;

