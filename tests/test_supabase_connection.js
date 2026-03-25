// Тест соединения с Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

console.log('=== Проверка соединения с Supabase ===');
console.log(`URL: ${url}`);
console.log(`Key: ${key ? key.substring(0, 20) + '...' : 'НЕ ЗАДАН'}`);

if (!url || !key) {
  console.error('❌ ОШИБКА: SUPABASE_URL или SUPABASE_KEY не заданы в .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  try {
    const tables = ['rental_rates', 'clients', 'equipment', 'faq', 'inquiries', 'dialog_logs'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(3);
      
      if (error) {
        console.log(`⚠️  ${table}: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`✅ ${table}: ${data.length} записей`);
        if (data.length > 0) {
          console.log(`   Колонки: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    }

    console.log('\n=== Проверка завершена ===');
  } catch (err) {
    console.error('❌ Критическая ошибка:', err.message);
  }
}

testConnection();
