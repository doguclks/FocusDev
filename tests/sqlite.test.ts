import Database from 'better-sqlite3';

console.log('Testing better-sqlite3 in tsx...');
try {
  const db = new Database(':memory:');
  console.log('Database instance created.');
  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, msg TEXT);');
  console.log('Table created.');
  db.prepare('INSERT INTO test (msg) VALUES (?)').run('Focus Dev SQLite Ready');
  console.log('Row inserted.');
  const row = db.prepare('SELECT * FROM test').get();
  console.log('SUCCESS! Row from SQLite:', row);
} catch (err: any) {
  console.error('CAUGHT ERROR:', err.message, err.stack);
}
