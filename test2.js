const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://fsyhunabticbctlxreff.supabase.co', 'sb_publishable_9iRnVWwKIA5YYoau4Lc7xA_WAOlsPh6', { auth: { persistSession: false }});
sb.from('profiles').select('*').then(res => console.log('Profiles:', res.data, res.error));
