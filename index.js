'use strict';

var serve = require('./staticFileServer');
var proxy = require('./proxyServer');
var router = require('koa-router')();
var fetch = require('node-fetch');
var path = require('path');

module.exports = function(options) {

  var app = options.app;
  var isProxyFirst = options.isProxyFirst;
  var proxyIgnore = options.proxyIgnore || [];
  var host = options.host;
  var username = options.username;
  var password = options.password;
  var context = options.context || '';
  var port = options.serverport || 8000;
  var mockList = options.mockList;
  var proxyList = options.proxyList;
  var staticFilePath = options.staticFilePath || "/dist";

  return {
    start : function(){

      function mock(){
        mockList.forEach(function( config ){
            console.log('Mock URL: ' ,'\x1b[33m', config['url'] + ' --> ' + config['json'] , '\x1b[0m', ' started.');
            router[ config['type'] ]( config['url'], function *(next) {
                var mockFile = require('../mock/' + config['json']);
                this.body = JSON.stringify(mockFile);
            });
        });
      }

    if(!isProxyFirst){
      mock();
    }

     app.use(serve(path.join(path.join(process.cwd(), staticFilePath)),{context : context}));
      if(proxyList){
        proxyList.forEach(function( config ){
          debugger
          app.use(proxy({
            host: config.host,
            context: config.context,
            proxyIgnore: proxyIgnore
           }));
          console.log('Proxy :','\x1b[33m', config.context +' -> ' , config.host , '\x1b[0m',' Started.');
        });
      }

      if(isProxyFirst){
        mock();
      }

      app.use(router.routes()).use(router.allowedMethods());
      console.log('FE test server  ','\x1b[33m','http://localhost:'+  port , '\x1b[0m',' Started.');
      app.listen(port);
    }
  }
};
