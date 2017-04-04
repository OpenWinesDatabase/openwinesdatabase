const fetch = require('node-fetch');
const fs = require('fs');
const LineByLineReader = require('line-by-line');

const COUNTRY = process.env.COUNTRY

if (!COUNTRY) {
  console.error('process.env.COUNTRY not defined!');
  process.exit();
}
console.log(`Fetching wines for country: ${COUNTRY}`);

const START_PAGE = parseInt(process.env.START_PAGE) || 1;
console.log(`Start page: ${START_PAGE}`);
const END_PAGE = parseInt(process.env.END_PAGE) || 100;
console.log(`End page: ${END_PAGE}`);

const SUFFIX = (START_PAGE === 1) ? COUNTRY : `${COUNTRY}-${START_PAGE}-${END_PAGE}`

fs.closeSync(fs.openSync(`./wines-${SUFFIX}.csv`, 'w'));

let urls = [];
console.log(START_PAGE)
console.log(END_PAGE)
for (let i = START_PAGE; i < END_PAGE; i++) {
  urls.push({ idx: i, url: `http://localhost:3000/explore?countryCodes=${COUNTRY}&page=${i}` });
}
const originalSize = urls.length;
console.log(originalSize)

function saveWine(wine, idx, url) {
  return new Promise((ok, ko) => {
    fs.appendFile(
      `./wines-${SUFFIX}.csv`,
      `${idx};${url};${wine.id};${wine.name};${wine.region};${wine.country};${wine.picture}\n`,
      err => {
        if (err) {
          ko(err);
        } else {
          ok();
        }
      }
    );
  });
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function saveNext() {
  const slug = urls.shift();
  const idx = slug.idx;
  const url = slug.url;

  function triggerNext() {
    const wait = 0; // random(5000, 15000);
    console.log(`Waiting for ${wait} ms. to fetch next round`);
    setTimeout(saveNext, wait);
  }

  function triggerError(err) {
    console.log(`Error, requeue and wait ... ${err}`);
    urls.push({ idx, url });
    setTimeout(saveNext, 60000);
  }

  console.log('Fetching wines from ' + url);
  fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
    .then(r => r.json(), triggerError)
    .then(
      data => {
        console.log(`Saving ${data.datas.length} wines from ${url}`);
        if (data.datas.length === 0) {
          return new Promise((ok, ko) => ko('fuuu'));
        }
        return Promise.all(
          data.datas.map((wine, j) => saveWine(wine, `${idx}-${j}`, url))
        );
      },
      triggerError
    )
    .then(triggerNext, triggerError);
}

function run() {
  // On lance les workers
  for (let i = 0; i < 40; i++) {
    saveNext();
  }
}

const lr = new LineByLineReader(`./wines-${SUFFIX}.csv`);
const set = {};

console.log('Removing already done urls');

lr.on('error', err => {
  console.log('error', err);
});

lr.on('line', line => {
  const url = line.split(';')[1];
  set[url] = 1;
});

lr.on('end', () => {
  const alreadyDone = Object.keys(set);
  urls = urls.filter(a => alreadyDone.indexOf(a.url) < 0);
  console.log(
    `Will fetch wines from ${urls.length} urls form ${originalSize}\n\n`
  );
  run();
});
