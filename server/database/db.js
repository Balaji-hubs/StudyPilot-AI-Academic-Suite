const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'study_planner.db');

let db;
let isNativeNodeSqlite = false;

try {
  const Database = require('better-sqlite3');
  db = new Database(dbPath);
} catch (err) {
  // Graceful fallback for Node.js 22/24+ without external C++ build tools installed
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(dbPath);
  isNativeNodeSqlite = true;

  // Add pragma helper
  db.pragma = function (pragmaStr) {
    try {
      return this.prepare(`PRAGMA ${pragmaStr};`).all();
    } catch {
      return this.exec(`PRAGMA ${pragmaStr};`);
    }
  };

  // Add transaction wrapper matching better-sqlite3 API
  db.transaction = function (fn) {
    return function (...args) {
      db.exec('BEGIN');
      try {
        const result = fn.apply(this, args);
        db.exec('COMMIT');
        return result;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    };
  };

  // Wrap prepare to safely map undefined -> null
  const origPrepare = db.prepare.bind(db);
  db.prepare = function (sql) {
    const stmt = origPrepare(sql);
    const origAll = stmt.all.bind(stmt);
    const origGet = stmt.get.bind(stmt);
    const origRun = stmt.run.bind(stmt);
    stmt.all = (...args) => origAll(...args.map(a => a === undefined ? null : a));
    stmt.get = (...args) => origGet(...args.map(a => a === undefined ? null : a));
    stmt.run = (...args) => origRun(...args.map(a => a === undefined ? null : a));
    return stmt;
  };
}

// Enable foreign keys and WAL mode for high performance and integrity
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Execute schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

console.log(`[Database] Relational SQLite initialized (${isNativeNodeSqlite ? 'built-in node:sqlite' : 'better-sqlite3'}) at: ${dbPath}`);

module.exports = db;
