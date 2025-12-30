# Article MCQs Table Setup

The `article_mcqs` table needs to be created in your database before MCQs can be generated.

## Option 1: Use the API Endpoint (Recommended)

1. Make sure you're logged into the admin panel
2. Open your browser's developer console
3. Run this command:
```javascript
fetch('/api/admin/create-mcqs-table', { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('sb-access-token') } }).then(r => r.json()).then(console.log)
```

## Option 2: Run SQL Directly in Supabase

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS article_mcqs (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_article_mcqs_article_id ON article_mcqs(article_id);
```

## Option 3: Use the Migration Script

```bash
cd admin-panel
npm run migrate-mcqs
```

Note: Make sure your `DATABASE_URL` is set in `.env.local` for this to work.

## Verify Table Creation

After running any of the above methods, you can verify the table was created by checking the Supabase Table Editor or running:

```sql
SELECT * FROM article_mcqs LIMIT 1;
```


