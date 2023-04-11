<h1 align="center">koa-rejwt</h1>

<p align="center" >
<img  src="https://img.shields.io/badge/build-passing-brightgreen" />
<img  src="https://img.shields.io/badge/npm-v0.1.0-blue" />
<img  src="https://img.shields.io/badge/License-MIT-green" />
</p>
<p align="center">
  <a href="https://github.com/chscript/koa-rejwt/blob/main/README_zh.md">中文</a>｜
  <a href="https://github.com/chscript/koa-rejwt/blob/main/README.md">English</a></p>


## 概述

koa-rejwt是一款同时支持token验证和无感刷新的Koa中间件。

## 下载

```shell
npm install koa-rejwt
```

## 选项说明

`secret: Secret | GetSecret`（必选）：验证密钥。

`reftime?: string | number`（可选）：token刷新时间。大于零且必须小于初始token的过期时间，用户在这个时间点之后若发起新的请求，响应头将会携带新的token发送到客户端。开发者可以通过设置响应拦截器等方式在响应头的`Authorization`字段获取刷新的token。

`signSecret?: Secret | GetSecret`（可选）：签名密钥。

`signOptions?: SignOptions`（可选）：签名选项。

`getToken?: GetToken`（可选）：获取token的函数。默认从请求头的`Authorization`字段获取token

`isRevoked?: IsRevoked`（可选）：验证token是否被撤销的函数。

`onExpired?: OnExpired`（可选）：处理过期token的函数。

`stateObjKey?: string`（可选）：存储在ctx.state对象中有效负载的属性名称。默认值为`payload`

`credentialsRequired?: boolean`（可选）：是否需要证书。默认值为`true`

## 使用方法

**客户端**：通过Axios设定请求拦截器和响应拦截器，分别用于验证本地存储的token和接收刷新的token。

```typescript
axios.interceptors.request.use( // 请求拦截器
    config => {
        if (httpConfig.useToken) { // 发送本地存储的token到服务端
            config.headers['Authorization'] = 'Bearer ' + localStorage.getItem('token')
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)
axios.interceptors.response.use( // 响应拦截器
    res => {
        if (!!res.headers['Authorization']) { // 接收来自服务端刷新的token
            localStorage.setItem('token', res.headers['authorization'])
        }
        return res.data
    },
    error => {
        return Promise.reject(error)
    }
)
```

**服务端**：在Koa实例对象`server`中设定koa-rejwt中间件，同时配置token的验证密钥和刷新时间。若客户端在设定token刷新时间后且未到达过期时间的阶段内发送携带token的请求，能够在上述客户端设定的响应拦截器中接收刷新的token并保存到`localStorage`对象。

```javascript
const Koa = require('koa')
const rejwt = require('koa-rejwt')

const server = new Koa()
server.use(
    rejwt({ secret: 'shared-secret', reftime: '2days' }).unless({
        path: ['/login']
    })) // 其中 reftime 必须小于token过期时间且不为0
server.listen(3000)
```

## License

[MIT](https://github.com/chscript/koa-rejwt/blob/main/LICENSE)

Copyright (c) 2023-present Steve Yang