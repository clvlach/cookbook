import express from 'express';
import path from 'path';
import sirv from 'sirv';

const app = express()
const port = 3000

app.get('api/', (req, res) => res.send('API call'));

app.use('/', sirv(path.join(__dirname, 'public'), {
  dev: process.env.NODE_ENV !== 'production',
  etag: true,
  single: true,
}));

app.listen(port, err => {
  if (err) throw err;
  console.log(`Ready on localhost:${port}.`);
});
