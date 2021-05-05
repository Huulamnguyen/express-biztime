// Connect to correct test DB
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompanies;
let testInvoices;

beforeEach(async () => {    
    let compResults = await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.') RETURNING code, name, description`);
    let invResults = await db.query(`INSERT INTO invoices (comp_code, amt, paid) VALUES ('apple', 300, true) RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testCompanies = compResults.rows[0];
    testInvoices = invResults.rows;
});

afterEach(async () => {
    await db.query(`DELETE FROM companies`)
});

afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
});

afterAll(async () => {
    await db.end()
});

/* GET /companies - return { companies: [company, ...]} */
describe("GET /companies", () => {
    test('Get a list with one company', async () => {
        const res = await request(app).get(`/companies`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ companies: [{"code": testCompanies.code, "name": testCompanies.name}] })
    })
})

/* GET /companies/:code */
describe(' GET /companies/:code', () => {
    test('Get a single company include its invoices', async () => {
        const res = await request(app).get(`/companies/${testCompanies.code}`)
        const company = testCompanies;
        company.invoices = testInvoices;
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ company: company })
    });
    test("Responds with 404 if can't find company", async () => {
        const res = await request(app).get(`/companies/fie`);
        expect(res.statusCode).toBe(404);
    });
});

/* POST /companies - create new company - return { comnpany: company} */
describe(" POST /companies", () => {
    test('Create a new company', async () => {
        const res = await request(app).post(`/companies`).send({ code:"fie", name:"Forward Insight", description:"a start-up company" })
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({ company: { code:"fie", name:"Forward Insight", description:"a start-up company"}})
    });
});

/* PATCH /companies/:code - update an existing company */
describe(' PATCH /companies/:code', () => {
    test('Update a company', async () => {
        const res = await request(app).patch(`/companies/${testCompanies.code}`).send({ name: "New Apple", description: "Maker of M1 chip" })
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ company: { code:`${testCompanies.code}`, name: "New Apple", description: "Maker of M1 chip"}})
    });
    test('Repond with 404 with invalid company code', async () => {
        const res = await request(app).patch(`/companies/fie`).send({ name: "New Apple", description: "Maker of M1 chip" })
        expect(res.statusCode).toBe(404)
    })
});

/* DELETE /companies/:code - delete a company - return { msg : "DELETED"} */
describe('DELETE /companies/:code', ()=>{
    test('Delete a single company', async () => {
        const res = await request(app).delete(`/companies/${testCompanies.code}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ msg: "DELETED!"})
    });
});

/* GET /invoices - get all invoices - return { invoices:[invoice, ...] } */
describe('GET /invoices', () => {
    test('Get a list with one invoice', async () => {
        const res = await request(app).get(`/invoices`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoices: [{ id: testInvoices[0].id, comp_code: testInvoices[0].comp_code } ]})
    });
});

/* GET /invoices/:id - get a single invoice */
describe('GET /invoices/:id', () => {
    test('Get a single invoice', async () => {
        const res = await request(app).get(`/invoices/${testInvoices[0].id}`)
        expect(res.statusCode).toBe(200)

        const test = { 
                        id: testInvoices[0].id, 
                        amt: testInvoices[0].amt, 
                        paid: testInvoices[0].paid, 
                        add_date: testInvoices[0].add_date, 
                        paid_date: testInvoices[0].paid_date,
                        company : testCompanies
                    }
        expect(res.body).toEqual({ invoice: test })
    })
});

/* POST /invoices - create a new invoice - return { invoice : invoice } */
describe('POST /invoices', () => {
    test('Crate a new invoice', async () => {
        const res = await request(app).post(`/invoices`).send({ comp_code: "apple", amt: 100 })
        expect(res.statusCode).toBe(201)
        expect(res.body).toEqual({
            invoice : { id: expect.any(Number), comp_code: "apple", amt: 100, paid: false, add_date: null, paid_date: null }
        })
    })
});

/* PATCH /invoices/:id - update a existing invoice */
describe('PATCH /invoices/:id', () => {
    test('Update an existing invoice', async () => {
        const res = await request(app).patch(`/invoices/${testInvoices[0].id}`).send({amt:500})
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ invoice: {
            id: testInvoices[0].id,
            comp_code: testInvoices[0].comp_code,
            amt: 500,
            paid: testInvoices[0].paid,
            add_date: testInvoices[0].add_date,
            paid_date: testInvoices[0].paid_date
        }})
    })
    test("Respond with 404 if invoice's id is invalid", async () => {
        const res = await request(app).patch(`/invoices/0`).send({amt:500})
        expect(res.statusCode).toBe(404)
    })
})

/* DELETE /invoices/:id - Delete an invoice - return { msg : "DELETED!"} */
describe('DELETE /invoices/:id', () => {
    test('Delete a single invoice', async () => {
        const res = await request(app).delete(`/invoices/${testInvoices[0].id}`)
        expect(res.statusCode).toBe(200)
    })
})