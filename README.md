# portal-fe-devServer

portal-fe-devServer 这个 package 名带有业务含义，其本身实现的功能是基于 koa 、koa-router、node-fetch 等 package 集成封装后实现了本地启动 server 以及 proxy 代理转发。

## Usage

install 安装

```
$ yarn add portal-fe-devServer
```

config 配置使用

```
var DevServer = require('portal-fe-devServer')
var koa = require('koa')
var app = koa();

var serverConfig = {
    // 将本地启动的 server 作为参数传递
    app: app,
    serverport: 8080,
    // 当前应用对应的上下文
    context: '/example',
    // isProxyFirst : 是否后端代理优先     
    // true -> 优先使用代理服务器数据，false -> 使用本地模拟数据
    isProxyFirst: true,
    //代理服务器列表
    proxyList: [{
        host: 'http://127.0.0.1:9090',
        context: '/integration'
    }, {
        host: 'http://172.20.8.76',
        context: '/workbench'
    }],
    //代理忽略的URL列表
    proxyIgnore: [
        "/",
        "/css.js",
        "/text.js",
        "/src/*",
        "/vendor/*",
        "/conf/*"
    ],
    //模拟请求列表
    mockList: [{
            type: "get",
            url: "/integration/system/nc",
            json: "nc.json"
        }, {
            type: "delete",
            url: "/integration/system/1",
            json: "deleteSystem.json"
        }]
}

var mockServer = new DevServer( serverConfig );

mockServer.start();

```
