import express from 'express';
import path from 'path';
import sirv from 'sirv';
import api from './api';

const app = express()
const port = 3000

app.use(function reqLog(req, res, next) {
  console.log(new Date() + ':', req.method, req.url);
  next()
});

app.use('/api/', api);

app.use('/', sirv(path.join(__dirname, 'public'), {
  dev: process.env.NODE_ENV !== 'production',
  etag: true,
  single: true,
  ignores: [
    '/api/.*',
  ],
}));

app.listen(port, err => {
  if (err) throw err;
  console.log(`Ready on localhost:${port}.`);
});
