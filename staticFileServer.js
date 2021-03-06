
'use strict';

/**
 * Module dependencies.
 */

const resolve = require('path').resolve;
const assert = require('assert');
const send = require('koa-send');

/**
 * Expose `serve()`.
 */

module.exports = serve;

/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

function serve(root, opts) {
  opts = opts || {};

  assert(root, 'root directory is required to serve files');

  // options
  opts.root = resolve(root);
  if (opts.index !== false) opts.index = opts.index || 'index.html';

  if (!opts.defer) {
    return function *serve(next){

      if (this.method == 'HEAD' || this.method == 'GET') {
        var realPath = this.path;
        if(opts.context && this.path.indexOf(opts.context) == 0){
          realPath = this.path.substr(opts.context.length)
          if (yield send(this, realPath, opts)) return;
        }

      }
      yield* next;
    };
  }

  return function *serve(next){
    yield* next;
    console.info(this.path)
    if (this.method != 'HEAD' && this.method != 'GET') return;
    // response is already handled
    if (this.body != null || this.status != 404) return;

    yield send(this, this.path, opts);
  };
}
