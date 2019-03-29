const express = require('express');
const responseTime = require('response-time');
const axios = require('axios');
const redis = require('redis');

const app = express();

const client = redis.createClient();

client.on('error', (err) => {
  console.log('Error' + err);
});

app.use(responseTime());

app.get('/api/search', (req, res) => {
  const query = (req.query.query).trim();
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&page=${query}`;
  return client.get(`wikipedia:${query}`, (err, result) => {
    if(result) {
      const resultJSON = JSON.parse(result);
      return res.status(200).json(resultJSON)
    } else {
      return axios.get(searchUrl)
        .then(Response => {
          const responseJSON = Response.data;
          client.setex(`wikipedia:${query}`, 3600, JSON.stringify({source: 'Redis Cache', ...responseJSON, }))
        })
        .catch(err => {
          return res.json(err)
        })
    }
  })
})

app.listen(3000, () => {
  console.log('Server listening on port:', 3000);
});