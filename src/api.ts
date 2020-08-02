import express from 'express';
import { RowDataPacket } from 'mysql2/promise';
import db from './db';

var router = express.Router();

router.get('/recipes', async (req, res) => {
  try {
    const [rows, fields] = await db.execute<RowDataPacket[]>('SELECT * FROM `recipes`');
    console.log(rows, fields);
    res.json(rows.map(row => {
      return {
        id: row.id,
        slug: row.recipe.slog,
        title: row.recipe.title
      };
    }));
  } catch (e) {
    res.status(500).send(JSON.stringify(e));
  }
});

export default router;
