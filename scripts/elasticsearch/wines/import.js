const elasticsearch = require('elasticsearch');
const csv = require('csv-parser');
const fs = require('fs');

const ES_URI = process.env.ES_URI || 'http://localhost:9200';
console.log(`Using Elastic URI: ${ES_URI}`);

const esClient = new elasticsearch.Client({
  host: ES_URI,
  log: 'error',
  requestTimeout: Infinity
});

const INDEX = process.env.INDEX || 'wines';
const TYPE = process.env.TYPE || 'wine';

const importItems = (file) => {
  let items = [];
  fs.createReadStream(file)
      .pipe(csv({
        separator: ';',
        headers: ['index', 'scraperUrl', 'id', 'name', 'region', 'country', 'photoUrl']
      }))
      .on('data', data => {
        // Bulk statement
        items.push({ "index" : { "_index" : INDEX, "_type" : TYPE, "_id" : data['id'] } });

        const name = data['name'];

        // Extract year from name
        const yearRegexp = /.* (\d\d\d\d)/g;
        const yearMatched = yearRegexp.exec(name);
        const year = yearMatched ? yearMatched[1] : undefined;

        // Extract color from name
        const colorRegexp = /.* (Rouge|Blanc|Rosé) .*/g;
        const colorMatched = colorRegexp.exec(name);
        const color = colorMatched ? colorMatched[1] : undefined;

        const region = data['region'];
        const finalName = name.replace(region, '').replace(year, '').trim();

        const item = {
          "@timestamp" : new Date(),
          "name": finalName,
          "year": year,
          "region": region,
          "color": color,
          "country": data['country'],
          "externalPhotoUrl" : data['photoUrl'],
          "origin": "Vivino",
        };
        items.push(item);
        if (items.length > 500) {
            esClient.bulk({
                body: items
            }, (err, resp) => {
                if (err) { throw err; }
                console.log(`${resp.items.length} items inserted from ${file}`);
            });
            items = [];
        }
      })
      .on('end', () => {
        esClient.bulk({
          body: items
        }, (err, resp) => {
          if (err) { throw err; }
          console.log(`${resp.items.length} items inserted from ${file}`);
        });
      });
}

// Import all data!
const dataDir = 'data';
fs.readdir(dataDir, (err, files) => {
  if (err) { throw err; }
  files.forEach(file => {
      console.log(`Importing items from ${file}`)
      importItems(`${dataDir}/${file}`)
  });
})
