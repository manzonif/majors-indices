const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 3600 });

const majors = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD'];

function getCircSupply(table, currentCode) {

    const row = table.find(`[data-search="${currentCode}"]`).parent();
    const circSupplyText = row.find("td:nth-child(5)").text().trim().replace(/[^0-9.-]+/g, '');
    const circSupply = parseInt(circSupplyText);
    return circSupply;
}

async function fetchData() {
  try {
    const response = await axios.get('https://fiatmarketcap.com/');
    const $ = cheerio.load(response.data);
    const table = $('#currency-ranking tbody tr');
    const res = [];
    for (let curr of majors) {
        res.push(getCircSupply(table, curr));
    }

    cache.set('circulatingSupply', res.join('|'));
  } catch (error) {
    console.error(error);
  }
}

fetchData();
setInterval(fetchData, 60*60*3600*24); // ogni giorno

app.get('/get-majors-circulating-supply', (req, res) => {
  const circulatingSupply = cache.get('circulatingSupply');
  res.write(circulatingSupply);
  res.end()
});

app.listen(3000, () => console.log('Server listening on port 3000'));