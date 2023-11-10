const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('bancoDeDados.db', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err.message);
  } else {
    console.log('Conexão ao banco de dados SQLite bem-sucedida');
  }
});

const schemaSQL = fs.readFileSync('schema.sql', 'utf8');

db.serialize(() => {
  db.exec(schemaSQL, (err) => {
    if (err) {
      console.error('Erro ao criar a tabela:', err.message);
    } else {
      console.log('Tabela criada com sucesso');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Erro ao fechar o banco de dados', err.message);
  } else {
    console.log('Conexão ao banco de dados SQLite fechada');
  }
});
