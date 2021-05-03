const express = require('express');
const ExpressError = require('../ExpressError');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
    const results = await db.query('SELECT id, comp_code FROM invoices')
    return res.json({ invoices: results.rows})
});

router.get('/:id', async (req, res, next) => {
    try {
        const invResults = await db.query(`SELECT * FROM invoices WHERE id = $1`, [req.params.id]);
        if (invResults.rows.length === 0){
            throw new ExpressError(`Invoice not found for id of ${req.params.id}`, 404)
        }
        const compResults = await db.query(`SELECT * FROM companies WHERE code = $1`, [invResults.rows[0].comp_code])
        const invoice = {
                            "id": invResults.rows[0].id, 
                            "amt":invResults.rows[0].amt,
                            "paid": invResults.rows[0].paid,
                            "add_date": invResults.rows[0].add_date,
                            "paid_date": invResults.rows[0].paid_date,
                            "company": compResults.rows[0]
                        }
        return res.json({ invoice : invoice })
    }catch(e){
        return next (e)
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const results = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,[comp_code, amt])
        return res.status(201).json({ invoice : results.rows[0] })
    } catch (e) {
        return next(e)
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const results = await db.query(`UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, id])
        if(results.rows.length === 0){
            throw new ExpressError(`Can't update invoice with id of ${req.params.id}`, 404)
        }
        return res.status(200).json({ invoice: results.rows[0] })
    } catch (e){
        return next(e)
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id = $1`, [id])
        return res.json({ msg: "DELETED!"})
    } catch (e) {
        return next(e)
    }
})

module.exports = router;