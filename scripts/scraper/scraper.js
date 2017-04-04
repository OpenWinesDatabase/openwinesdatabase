const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

const app = express();

function retrieveData($) {
  const datas = [];
  $('.card-lg').each(function(i, elem) {
    const css = $(this).find('.wine-card__image').css();
    let picture = undefined;
    if (css && css['background-image']) {
      const backgroundImage = css['background-image'];
      const start = backgroundImage.indexOf('//')
      if (start !== -1) {
        picture = `http:${backgroundImage.substring(start, backgroundImage.length - 1)}`
      }
    }
    const id = $(this).find('.wine-card__name > a').attr('href').substring(1).split('/').join('-');
    const names = $(this).find('.wine-card__name > a > span');
    const name1 = $(names[0]).text().split('\n').join('')
    const name2 = $(names[1]).text().split('\n').join('')
    const regions = $(this).find('.wine-card__region > a');
    const region = $(regions[0]).text().split('\n').join('')
    const country = $(regions[1]).text().split('\n').join('')
    const data = {
      id: id,
      name: `${name1} ${name2}`,
      region: region,
      country: country,
      picture: picture
    };
    datas.push(data);
  });
  return datas;
}

const wineTypes = [
  {
    name: 'red',
    id: 1
  },
  {
    name: 'white',
    id: 2
  },
  {
    name: 'sparkling',
    id: 3
  },
  {
    name: 'rose',
    id: 4
  },
  {
    name: 'dessert',
    id: 7
  },
  {
    name: 'port',
    id: 24
  },
]


app.get('/', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  const routes = [];
  routes.push({
    route: `${req.protocol}://${req.headers.host}/wine-types`,
    description: 'Retrieve all Wine Types (ids are used in /explore route)',
  });
  routes.push({
    route: `${req.protocol}://${req.headers.host}/grapes`,
    description: 'Retrieve all grape_ids Types (ids are used in /explore route)'
  });
  routes.push({
    route: `${req.protocol}://${req.headers.host}/wine-countries`,
    description: 'Retrieve all Countries (code are used in /explore route)'
  });
  routes.push({
    route: `${req.protocol}://${req.headers.host}/wine-styles`,
    description: 'Retrieve all Wine Styles (ids are used in /explore route)'
  });
  routes.push({
    route: `${req.protocol}://${req.headers.host}/foods`,
    description: 'Retrieve all Food Types (ids are used in /explore route)'
  });
  routes.push({
    route: `${req.protocol}://${req.headers.host}/search`,
    description: 'Search wine by name',
    params: {
      mandatory: {
        q: 'query'
      },
      optional: {
        page: 'page to fetch'
      }
    },
    sample: `${req.protocol}://${req.headers.host}/search?q=saint%20emilion&page=2`
  });
  routes.push({
    route: `${req.protocol}://${req.headers.host}/explore`,
    description: 'Explore database with wine-types, grapes, wine-countries, wine-styles, foods filters',
    params: {
      optional: {
        wineTypes: 'Wine types ids (by default, all ids are used). ex: wineTypes=2,3',
        grapes: 'Grapes ids filter. Ex: grapes=2,3',
        wineStyles: 'Wine Styles ids filter. Ex: grapes=2,3',
        countryCodes: 'Country codes filter. Ex: grapes=fr,sp',
        foods: 'Foods ids filter. Ex: foods=2,3',
        page: 'page to fetch'
      }
    },
    sample: `${req.protocol}://${req.headers.host}/explore?countryCodes=fr,es&grapes=5`
  });
  res.send(routes)
})

app.get('/wine-types', function (req, res) {

  res.setHeader('Content-Type', 'application/json')
  res.send(wineTypes.map(elem => elem.name));

});



app.get('/grapes', function (req, res) {

  const options = {
    url: 'https://www.vivino.com/grapes',
    headers: {
      'Accept': 'application/json'
    }
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        res.setHeader('Content-Type', 'application/json')
        res.send(body);
     }
   });
});

app.get('/wine-countries', function (req, res) {

 const options = {
   url: 'https://www.vivino.com/wine-countries',
   headers: {
     'Accept': 'application/json'
   }
 };

 request(options, function(error, response, body) {
   if (!error && response.statusCode == 200) {
       res.setHeader('Content-Type', 'application/json')
       res.send(body);
    }
  });
});

app.get('/wine-styles', function (req, res) {

  const options = {
    url: 'https://www.vivino.com/wine-styles',
    headers: {
      'Accept': 'application/json'
    }
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        res.setHeader('Content-Type', 'application/json')
        res.send(body);
     }
   });
});

app.get('/foods', function (req, res) {

  const options = {
    url: 'https://www.vivino.com/foods',
    headers: {
      'Accept': 'application/json'
    }
  };

  request(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        res.setHeader('Content-Type', 'application/json')
        res.send(body);
     }
   });
});

app.get('/explore', function (req, res) {
  let wineTypeIds = [];
  if (req.query.wineTypes) {
    wineTypeIds = req.query.wineTypes.split(',').map(name => wineTypes.find(elem => elem.name.toLowerCase() === name.toLowerCase() || elem.id === name)).map(elem => elem.id);
  }
  if (wineTypeIds == null || wineTypeIds.length === 0) {
    wineTypeIds = wineTypes.map(elem => elem.id);
  }
  const wineTypesParams = wineTypeIds.map(id => `wine_type_ids%5B%5D=${id}`).join('&');

  let grapesParams = undefined;
  if (req.query.grapes) {
      grapesParams = req.query.grapes.split(',').map(id => `grape_ids%5B%5D=${id}`).join('&');
  }

  let wineStylesParams = undefined;
  if (req.query.wineStyles) {
      wineStylesParams = req.query.wineStyles.split(',').map(id => `wine_style_ids%5B%5D=${id}`).join('&');
  }

  let countryCodesParams = undefined;
  if (req.query.countryCodes) {
      countryCodesParams = req.query.countryCodes.split(',').map(id => `country_codes%5B%5D=${id}`).join('&');
  }

  let foodsParams = undefined;
  if (req.query.foods) {
      foodsParams = req.query.foods.split(',').map(id => `foods_ids%5B%5D=${id}`).join('&');
  }

  const params = [wineTypesParams, grapesParams, wineStylesParams, countryCodesParams, foodsParams].filter(param => param !== undefined).join('&');

  const page = req.query.page ? parseInt(req.query.page) : 1;
  //https://www.vivino.com/explore?country_code=fr&state=&wine_type_ids%5B%5D=1&grape_ids%5B%5D=15&grape_ids%5B%5D=5&country_codes%5B%5D=es&country_codes%5B%5D=fr&wine_style_ids%5B%5D=143&foods_ids%5B%5D=16
  request(`https://www.vivino.com/explore?${params}&page=${page}`, function(error, response, body) {

    const $ = cheerio.load(body);
    const datas = retrieveData($);
    const index = body.indexOf('var maxPages = ');
    let lastPage = -1;
    if (index !== -1) {
      const remaining = body.substring(index).replace('var maxPages = ', '');
      lastPage = remaining.substring(0, remaining.indexOf(';'));

    }
    const links = [];

    if (page > 1) {
      req.query.page = page - 1;
      const queryParams = Object.keys(req.query).map(value => `${value}=${req.query[value]}`).join('&');
      links.push({
        'previous': encodeURI(`${req.protocol}://${req.headers.host}${req.path}?${queryParams}`)
      })
    }

    if (page < lastPage) {
      req.query.page = page + 1;
      const queryParams = Object.keys(req.query).map(value => `${value}=${req.query[value]}`).join('&');
      links.push({
        'next': encodeURI(`${req.protocol}://${req.headers.host}${req.path}?${queryParams}`)
      })
    }

    if (lastPage !== -1) {
      req.query.page = lastPage;
      const queryParams = Object.keys(req.query).map(value => `${value}=${req.query[value]}`).join('&');
      links.push({
        'last': encodeURI(`${req.protocol}://${req.headers.host}${req.path}?${queryParams}`)
      })
    }

    res.setHeader('Content-Type', 'application/json')
    res.send({
      links,
      datas
    });
  });
})

app.get('/search', function (req, res) {
  var query = req.query.q
  var start = req.query.page || 1
  request(`https://www.vivino.com/search/wines?q=${query}&start=${start}`, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      const datas = retrieveData($);
      const previous = $('.search-page__pagination > .previous');
      const previousValue = previous.attr('value');
      const previousDisabled = previous.attr('disabled');
      const next = $('.search-page__pagination > .next');
      const nextValue = next.attr('value');
      const nextDisabled = next.attr('disabled');

      const links = [];
      if (previousDisabled === undefined) {
        req.query.page = previousValue;
        const queryParams = Object.keys(req.query).map(value => `${value}=${req.query[value]}`).join('&');
        links.push({
          'previous': encodeURI(`${req.protocol}://${req.headers.host}${req.path}?${queryParams}`)
        });
      }
      if (nextDisabled === undefined) {
        req.query.page = nextValue;
        const queryParams = Object.keys(req.query).map(value => `${value}=${req.query[value]}`).join('&');
        links.push({
          'next': encodeURI(`${req.protocol}://${req.headers.host}${req.path}?${queryParams}`)
        });
      }

      res.setHeader('Content-Type', 'application/json')
      res.send({
        links,
        datas
      });
    }
  })
})

const port = 3000
app.listen(port, function() {
  console.log(`Scraper started! Browse http://localhost:${port}`)
});
