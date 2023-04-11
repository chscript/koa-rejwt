<h1 align="center">koa-rejwt</h1>

<p align="center" >
<img  src="https://img.shields.io/badge/build-passing-brightgreen" />
<img  src="https://img.shields.io/badge/npm-v0.1.0-blue" />
<img  src="https://img.shields.io/badge/License-MIT-green" />
</p>
<p align="center">
  <a href="https://github.com/chscript/koa-rejwt/blob/main/README_zh.md">中文</a>｜
  <a href="https://github.com/chscript/koa-rejwt/blob/main/README.md">English</a></p>


## Introduction

koa-rejwt is a Koa middleware that supports both token validation and refresh.

## Install

```shell
npm install koa-rejwt
```

## Option

`secret: Secret | GetSecret` (required): Verify key.

`reftime?: string | number` (optional): Token refresh time. Greater than zero and must be less than the expiration time of the initial token. If a user initiates a new request after the refresh time, the response header will carry the new token and send it to the client. Developers can set the response interceptor on the client side to obtain the refreshed token in the `Authorization` field of the response header.

`signSecret?: Secret | GetSecret` (optional): Signature key.

`signOptions?: SignOptions` (optional): Signature options.

`getToken?: GetToken` (optional): A function that receives the express `Request` and returns the token, by default it looks in the `Authorization` header.

`isRevoked?: IsRevoked` (optional): A function used to verify whether a token has been revoked.

`onExpired?: OnExpired` (optional): A function used to handle expired tokens.

`stateObjKey?: string` (optional): The attribute name of the payload stored in the `ctx. state` object. The default value is `payload`.

`credentialsRequired?: boolean` (optional): Whether to use a certificate. The default value is `true`.

## Usage & Example

**client**：Set request interceptors and response interceptors through Axios to verify locally stored tokens and receive refreshed tokens, respectively.

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

**server**：Set the koa rejwt middleware in the Koa instance object `server`, while also configuring the token's verification key and refresh time. If the client sends a request to carry a token after setting the token refresh time but before reaching the expiration time, it can receive the refreshed token in the response interceptor set by the client and save it to the `localStorage` object.

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