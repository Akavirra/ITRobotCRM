/**
 * Migration script to add new columns to students table
 * Run with: node scripts/migrate-students.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'school.dev.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Starting students table migration...');

// Get current columns
const tableInfo = db.pragma('table_info(students)');
const columns = tableInfo.map(col => col.name);

console.log('Current columns:', columns);

// Add birth_date column if not exists
if (!columns.includes('birth_date')) {
  console.log('Adding birth_date column...');
  db.exec(`ALTER TABLE students ADD COLUMN birth_date DATE`);
  console.log('Added birth_date column');
} else {
  console.log('birth_date column already exists');
}

// Add photo column if not exists
if (!columns.includes('photo')) {
  console.log('Adding photo column...');
  db.exec(`ALTER TABLE students ADD COLUMN photo TEXT`);
  console.log('Added photo column');
} else {
  console.log('photo column already exists');
}

// Verify the migration
console.log('\nVerifying migration...');
const newTableInfo = db.pragma('table_info(students)');
console.log('Updated columns:');
newTableInfo.forEach(col => {
  console.log(`  - ${col.name}: ${col.type} (nullable: ${col.notnull === 0}, default: ${col.dflt_value})`);
});

// Show sample data
console.log('\nSample students after migration:');
const students = db.prepare('SELECT id, public_id, full_name, birth_date, photo FROM students LIMIT 3').all();
console.log(students);

db.close();
console.log('\nMigration completed successfully!');
