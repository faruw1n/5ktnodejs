const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created TEXT NOT NULL,
  changed TEXT NOT NULL
)`);

app.use(bodyParser.json());

const getCurrentDate = () => new Date().toISOString();

app.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving notes' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No notes found' });
    }
    res.status(200).json(rows);
  });
});

app.get('/note/:id', (req, res) => {
  const noteId = req.params.id;
  db.get('SELECT * FROM notes WHERE id = ?', [noteId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving note' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(row);
  });
});

app.get('/note/read/:title', (req, res) => {
  const noteTitle = req.params.title;
  db.get('SELECT * FROM notes WHERE title = ?', [noteTitle], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving note' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(row);
  });
});

app.post('/note/', (req, res) => {
  const { title, content } = req.body;
  const created = getCurrentDate();
  const changed = created;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  db.run('INSERT INTO notes (title, content, created, changed) VALUES (?, ?, ?, ?)', 
    [title, content, created, changed], 
    function(err) {
      if (err) {
        return res.status(409).json({ message: 'Error creating note' });
      }
      const newNote = {
        id: this.lastID,
        title,
        content,
        created,
        changed
      };
      res.status(201).json(newNote);
    });
});

app.delete('/note/:id', (req, res) => {
  const noteId = req.params.id;
  db.run('DELETE FROM notes WHERE id = ?', [noteId], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting note' });
    }
    if (this.changes === 0) {
      return res.status(409).json({ message: 'Note not found' });
    }
    res.status(204).send();
  });
});

app.put('/note/:id', (req, res) => {
  const noteId = req.params.id;
  const { title, content } = req.body;
  const changed = getCurrentDate();

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  db.run('UPDATE notes SET title = ?, content = ?, changed = ? WHERE id = ?', 
    [title, content, changed, noteId], function(err) {
      if (err) {
        return res.status(409).json({ message: 'Error updating note' });
      }
      if (this.changes === 0) {
        return res.status(409).json({ message: 'Note not found' });
      }
      const updatedNote = {
        id: noteId,
        title,
        content,
        created: changed, 
      };
      res.status(204).json(updatedNote);
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
