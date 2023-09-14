process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');

// ISBN of sample book, global!
let book_isbn;

beforeEach(async function () {
    // make a book
    let result = await db.query(
        `INSERT INTO books 
        (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES 
        ('123456789', 'https://amzn.co/test','Craig Alanson', 'English', 500, 'A Publisher', 'ExFor: Book 2', 2011)
        RETURNING isbn`
    );
    // assign it to book_isbn prop
    book_isbn = result.rows[0].isbn;
});

// post + post error
describe('POST /books', function () {
    test('Create New Book', async function () {
        let response = await request(app).post('/books').send({
            isbn: '23456789',
            amazon_url: 'https://amzn.co/test2',
            author: 'George RR Martin',
            language: 'English',
            pages: 987,
            publisher: 'Someone',
            title: 'A Dance with Dragons X7',
            year: 2022,
        });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty('isbn');
    });
    test('Attempt creation without an isbn', async function () {
        let response = await request(app).post('/books').send({
            amazon_url: 'https://amzn.co/test2',
            author: 'George RR Martin',
            language: 'English',
            pages: 987,
            publisher: 'Someone',
            title: 'A Dance with Dragons X7',
            year: 2022,
        });
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain(
            'instance requires property "isbn"'
        );
    });
});

// get
describe('GET /books', function () {
    test('Get all books', async function () {
        let response = await request(app).get('/books');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('books');
        expect(response.body.books[0]).toHaveProperty('isbn');
    });
});

// get/isbn + 404

describe('GET /books/ :isbn', function () {
    test('Grab a single book by isbn', async function () {
        let response = await request(app).get(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('book');
        expect(response.body.book.isbn).toBe(book_isbn);
    });
    test('404 from a bad isbn', async function () {
        let response = await request(app).get(`/books/36664`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain(
            "There is no book with an isbn '36664"
        );
    });
});

// put + bad update
describe('PUT /books/:isbn', function () {
    test('Update existing book', async function () {
        let response = await request(app).put(`/books/${book_isbn}`).send({
            amazon_url: 'https://amzn.co/test2',
            author: 'George RR Martin',
            language: 'English',
            pages: 987,
            publisher: 'Someone',
            title: 'A Dance with Dragons X7',
            year: 2022,
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.book.title).toBe('A Dance with Dragons X7');
    });
    test('404 from a bad isbn', async function () {
        let response = await request(app).put('/books/36664').send({
            amazon_url: 'https://amzn.co/test2',
            author: 'George RR Martin',
            language: 'English',
            pages: 987,
            publisher: 'Someone',
            title: 'A Dance with Dragons X7',
            year: 2022,
        });
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain(
            "There is no book with an isbn '36664"
        );
    });
});

// delete + 404
describe('DELETE /books/ :isbn', function () {
    test('Delete a single book by isbn', async function () {
        let response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            message: 'Book deleted',
        });
    });
    test('404 from a bad isbn', async function () {
        let response = await request(app).delete(`/books/36664`);
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error.message).toContain(
            "There is no book with an isbn '36664"
        );
    });
});

afterEach(async function () {
    await db.query(`DELETE FROM BOOKS`);
});

afterAll(async function () {
    await db.end();
});
