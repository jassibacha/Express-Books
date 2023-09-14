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
describe('POST Testing', function () {
    test('Create New Book', async function () {
        let response = await request(app).post('/books/').send({
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
        let response = await request(app).post('/books/').send({
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

// get/isbn + 404

// put + bad update

// delete + 404

afterEach(async function () {
    await db.query(`DELETE FROM BOOKS`);
});

afterAll(async function () {
    await db.end();
});
