import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name, type, parent_id')
    .is('parent_id', null)
    .limit(20);
  console.log(data);
  console.log(data);
}
test();
