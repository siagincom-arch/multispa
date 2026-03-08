// Bot Multispa — Configuration
require('dotenv').config();

module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
  },
  manager: {
    email: process.env.MANAGER_EMAIL || 'siamultispa@gmail.com',
    phones: ['+371 270 66 380', '+371 292 46 838'],
  },
  company: {
    name: 'SIA «MULTISPA»',
    website: 'betonaveidni.lv',
    workingHours: 'Пн–Пт 9:00–18:00',
  },
  dialog: {
    inactivityTimeoutMs: 20000, // 20 seconds
  },
};
