var request = require('request');
var http = require('http');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
var Iconv = require('iconv').Iconv;

var getParams = function(url) {
  const params = {};
  const splited1 = url.split('?');
  if (splited1.length === 2) {
    const paramLines = splited1[1].split('&');
    paramLines.forEach(paramLine => {
      const splited2 = paramLine.split('=');
      if (splited2.length === 2) {
        params[splited2[0]] = decodeURIComponent(splited2[1]);
      }
    });
  }
  return params;
};

http.createServer(function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': 'https://www.chatwork.com'
  });
  const params = getParams(req.url);
  request(
    {
      method: 'GET',
      url: params.url,
      encoding: null,
      headers: {
        'Content-Type': 'text/html',
        'User-Agent': req.headers['user-agent']
      }
    },
    function(error, response, body) {
      console.log(response.client._host);
      {
        var contentType = response.headers['content-type'];

        var index = contentType.indexOf('charset=');
        if (index >= 0) {
          var charset = contentType.substr(index + 8, contentType.length - 8);
          if (charset != 'none') {
            var iconv = new Iconv(charset, `UTF-8//TRANSLIT//IGNORE`);
            body = iconv.convert(body).toString();
          }
        }
      }
      const dom = new JSDOM(body);
      const metaElements = Array.prototype.concat.apply([], dom.window.document.getElementsByTagName('meta'));
      const propertyAndContents = metaElements
        .map(e => {
          const attributes = Array.prototype.concat.apply([], e.attributes);
          const property = attributes.find(a => a.name === 'property');
          const content = attributes.find(a => a.name === 'content');
          if (property && content) {
            return {
              property : property.value,
              content : content.value
            };
          }
          return null;
        })
        .filter(a => a != null)
        .reduce((o, c) => Object.assign(o, {[c.property]: c.content}), {});
      const result = {};
      if (propertyAndContents['og:title'] != null) {
        result.title = propertyAndContents['og:title'];
      } else if (propertyAndContents['twitter:title'] != null) {
        result.title = propertyAndContents['twitter:title'];
      }
      if (propertyAndContents['og:image'] != null) {
        result.image = propertyAndContents['og:image'];
      } else if (propertyAndContents['twitter:image'] != null) {
        result.image = propertyAndContents['twitter:image'];
      }
      if (propertyAndContents['og:description'] != null) {
        result.description = propertyAndContents['og:description'];
      } else if (propertyAndContents['twitter:description'] != null) {
        result.description = propertyAndContents['twitter:description'];
      }
      res.end(JSON.stringify(result));
    }
  );
    
}).listen(8001, '127.0.0.1');