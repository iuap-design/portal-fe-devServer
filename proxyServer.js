'use strict';

var join = require('url').resolve;
var iconv = require('iconv-lite');
var coRequest = require('co-request');

module.exports = function(options) {
  options || (options = {});
  var request = coRequest.defaults({ jar: typeof options.jar === 'undefined' ? true : options.jar, followRedirect:false   });

  if (!(options.host || options.map || options.url)) {
    throw new Error('miss options');
  }

  return function* proxy(next) {
    if(this.path.indexOf(options.context) != 0)
      return yield* next;

    var url = resolve(this.path,options);
    // don't match
    if (!url) {
      return yield* next;
    }
    // if match option supplied, restrict proxy to that match

    if (this.method.toLowerCase() === 'get' && options.proxyIgnore.length > 0){
      for(var i = 0; i< options.proxyIgnore.length; i++){
        var ignoreUrl = options.proxyIgnore[i];
        var urlLength = ignoreUrl.length;
        //忽略以url开始的所有请求
        if (ignoreUrl.indexOf('*') === (urlLength - 1)){
            ignoreUrl =  ignoreUrl.substring(0,urlLength - 1);
            if (this.url.indexOf(ignoreUrl) === 0){
              return yield* next;
            }
        }
        //只忽略该url请求
        else if(this.url === ignoreUrl){
          return yield* next;
        }
      }
    }



    var parsedBody = getParsedBody(this);

    var opt = {
      url: url + '?' + this.querystring,
      headers: this.header,
      encoding: null,
      method: this.method,
      body: parsedBody
    };
    var localhost = this.request.host;
    // set 'Host' header to options.host (without protocol prefix), strip trailing slash
    if (options.host) opt.headers.host = options.host.slice(options.host.indexOf('://')+3).replace(/\/$/,'');

    if (options.requestOptions) {
      Object.keys(options.requestOptions).forEach(function (option) { opt[option] = options.requestOptions[option]; });
    }
    var requestThunk = request(opt);

    if (parsedBody) {
      var res = yield requestThunk;
    } else {
      // Is there a better way?
      // https://github.com/leukhin/co-request/issues/11
      var res = yield pipeRequest(this.req, requestThunk);
    }

    this.status = res.statusCode;
    for (var name in res.headers) {
      // http://stackoverflow.com/questions/35525715/http-get-parse-error-code-hpe-unexpected-content-length
      if (name === 'transfer-encoding') {
        continue;
      }
      if(name.toLowerCase() === 'location'){
        if(res.headers[name].indexOf(options.host)!=-1){
          this.set(name, res.headers[name].replace(options.host,'http://'+localhost));
           continue;
        }
      }
      this.set(name, res.headers[name]);

    }

    if (options.encoding === 'gbk') {
      this.body = iconv.decode(res.body, 'gbk');
      return;
    }
    //console.log(res.body);
    this.body = res.body;
  };
};


function resolve(path, options) {
  var url = options.url;
  if (url) {
    if (!/^http/.test(url)) {
      url = options.host ? join(options.host, url) : null;
    }
    return ignoreQuery(url);
  }

  if (typeof options.map === 'object') {
    if (options.map && options.map[path]) {
      path = ignoreQuery(options.map[path]);
    }
  } else if (typeof options.map === 'function') {
    path = options.map(path);
  }
  return options.host ? join(options.host ,path) : null;
}

function ignoreQuery(url) {
  return url ? url.split('?')[0] : null;
}

function getParsedBody(ctx){
  var body = ctx.request.body;
  if (body === undefined || body === null){
    return undefined;
  }
  var contentType = ctx.request.header['content-type'];
  if (!Buffer.isBuffer(body) && typeof body !== 'string'){
    if (contentType && contentType.indexOf('json') !== -1){
      body = JSON.stringify(body);
    } else {
      body = body + '';
    }
  }
  return body;
}

function pipeRequest(readable, requestThunk){
  return function(cb){
    readable.pipe(requestThunk(cb));
  }
}
