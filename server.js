const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'library_db',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function validId(id) {
    return Number.isInteger(Number(id)) && Number(id) > 0;
}

// Test database connection
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ message: 'Database connection successful' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// F2.1 - Show all authors
// F2.1 - Show all authors
app.get('/api/authors', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT author_id, name, country
            FROM AUTHOR
            ORDER BY author_id
        `);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Could not load authors'
        });
    }
});

// F2.2 - Add an author
app.post('/api/authors', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const country = String(req.body.country || '').trim();

        if (!name || !country) {
            return res.status(400).json({
                error: 'Name and country are required'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO AUTHOR (name, country) VALUES (?, ?)',
            [name, country]
        );

        res.status(201).json({
            message: 'Author added successfully',
            author_id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not add author' });
    }

});

// F2.3 - Edit an author
app.put('/api/authors/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const name = String(req.body.name || '').trim();
        const country = String(req.body.country || '').trim();

        if (!validId(id)) {
            return res.status(400).json({ error: 'Invalid author ID' });
        }

        if (!name || !country) {
            return res.status(400).json({
                error: 'Name and country are required'
            });
        }

        const [result] = await pool.query(
            'UPDATE AUTHOR SET name = ?, country = ? WHERE author_id = ?',
            [name, country, id]
        );

        if (result.affectedRows === 0) {
            const [rows] = await pool.query(
                'SELECT author_id FROM AUTHOR WHERE author_id = ?',
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Author not found' });
            }
        }

        res.json({ message: 'Author updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not update author' });
    }

});

// F2.5 - Remove an author
app.delete('/api/authors/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!validId(id)) {
            return res.status(400).json({ error: 'Invalid author ID' });
        }

        const [result] = await pool.query(
            'DELETE FROM AUTHOR WHERE author_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Author not found' });
        }

        res.json({
            message: 'Author and associated books deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not delete author' });
    }

});

// F2.1 - Show all books with author IDs
app.get('/api/books', async (req, res) => {
    try {
        const [rows] = await pool.query(`             SELECT
                b.book_id,
                b.title,
                b.price,
                b.author_id,
                a.name AS author_name
            FROM BOOK b
            JOIN AUTHOR a ON b.author_id = a.author_id
            ORDER BY b.book_id
        `);

        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not load books' });
    }

});

// F2.2 - Add a book
app.post('/api/books', async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const price = Number(req.body.price);
        const authorId = Number(req.body.author_id);

        if (
            !title ||
            req.body.price === '' ||
            req.body.price === undefined ||
            !Number.isFinite(price) ||
            price < 0 ||
            !validId(authorId)
        ) {
            return res.status(400).json({
                error: 'Enter a valid title, price, and author'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO BOOK (title, price, author_id) VALUES (?, ?, ?)',
            [title, price, authorId]
        );

        res.status(201).json({
            message: 'Book added successfully',
            book_id: result.insertId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Author does not exist' });
        }

        res.status(500).json({ error: 'Could not add book' });
    }

});

// F2.3 - Edit a book
app.put('/api/books/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const title = String(req.body.title || '').trim();
        const price = Number(req.body.price);
        const authorId = Number(req.body.author_id);

        if (!validId(id)) {
            return res.status(400).json({ error: 'Invalid book ID' });
        }

        if (
            !title ||
            req.body.price === '' ||
            req.body.price === undefined ||
            !Number.isFinite(price) ||
            price < 0 ||
            !validId(authorId)
        ) {
            return res.status(400).json({
                error: 'Enter a valid title, price, and author'
            });
        }

        const [result] = await pool.query(
            `UPDATE BOOK
         SET title = ?, price = ?, author_id = ?
         WHERE book_id = ?`,
            [title, price, authorId, id]
        );

        if (result.affectedRows === 0) {
            const [rows] = await pool.query(
                'SELECT book_id FROM BOOK WHERE book_id = ?',
                [id]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }
        }

        res.json({ message: 'Book updated successfully' });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Author does not exist' });
        }

        res.status(500).json({ error: 'Could not update book' });
    }

});

// F2.4 - Remove a book
app.delete('/api/books/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!validId(id)) {
            return res.status(400).json({ error: 'Invalid book ID' });
        }

        const [result] = await pool.query(
            'DELETE FROM BOOK WHERE book_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not delete book' });
    }

});

// Start server
async function startServer() {
    try {
        await pool.query('SELECT 1');

        app.listen(PORT, () => {
            console.log(`Library website running at http://localhost:${PORT}`);
            console.log('Database connection successful');
        });
    } catch (error) {
        console.error('Could not connect to MySQL:', error.message);
        process.exit(1);
    }

}

startServer();
