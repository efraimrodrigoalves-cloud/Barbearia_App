const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // to avoid global fetch issues in node < 18, though 20 supports it

const sb = createClient('https://fsyhunabticbctlxreff.supabase.co', 'sb_publishable_9iRnVWwKIA5YYoau4Lc7xA_WAOlsPh6', { auth: { persistSession: false }});
sb.from('appointments').select('*').then(res => console.log(JSON.stringify(res.data, null, 2)));
