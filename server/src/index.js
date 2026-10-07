import 'dotenv/config';
import { createApp } from './app.js';
import { initDatabase } from './db/init.js';

const port = Number(process.env.PORT || 4000);

try {
  await initDatabase();
} catch (error) {
  console.error('No se pudo preparar MySQL.');
  console.error(error.message);
  process.exit(1);
}

createApp().listen(port, () => {
  console.log(`API de Nexo en http://localhost:${port}`);
});
