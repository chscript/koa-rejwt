'use strict'

var jsonwebtoken = require('jsonwebtoken')
var ms = require('ms')
var unless = require('koa-unless')

const UnauthorizedError = new Proxy(
    {
        credentials_required: 'No authorization token was found',
        credentials_bad_format: 'Format is Authorization: Bearer [token]',
        expired_token: 'The received token has expired',
        invalid_token: 'The received token is invalid',
        not_activated_token: 'The token received is not activated',
        revoked_token: 'The received token has been revoked'
    },
    {
        get: (target, propKey) => {
            return `${propKey} : ${target[propKey]}`
        }
    }
)

const isFunction = func => {
    return typeof func === 'function'
}
const defaultValue = (param, value) => {
    return param === undefined ? value : param
}
const getSecretValue = (secret, temp) => {
    temp = defaultValue(temp, secret)
    return typeof temp === 'function' ? temp : async () => secret
}
const verifyParams = options => {
    if (!options.secret) {
        throw new RangeError('koa-rejwt: `secret` is a required option')
    }
}
const resolveHeader = (ctx, credentialsRequired) => {
    if (credentialsRequired) {
        if (!ctx.header || !ctx.header['authorization']) {
            ctx.throw(401, UnauthorizedError['credentials_required'])
        }
        const parts = ctx.header['authorization'].trim().split(' ')
        if (parts.length === 2) {
            const scheme = parts[0]
            const credentials = parts[1]
            if (/^Bearer$/i.test(scheme)) {
                return credentials
            }
        }
        ctx.throw(401, UnauthorizedError['credentials_bad_format'])
    }
}
const verifyToken = (token, secret, verifyOptions) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, secret, verifyOptions, error => {
            error ? reject(error) : resolve()
        })
    })
}
const refreshToken = (ctx, reftime, decodedToken, secret, signOptions) => {
    const curtime = Math.floor(Date.now() / 1000)
    const { exp, iat, nbf, jti, ...payload } = decodedToken?.payload
    if (exp && iat && reftime < exp - iat) {
        if (reftime <= curtime - iat) {
            ctx.response.set(
                'authorization',
                jsonwebtoken.sign(
                    { iat: curtime, exp: curtime + exp - iat, ...payload },
                    secret,
                    signOptions
                )
            )
            // console.log(ctx.response.headers['authorization'])
        }
        return
    }
    throw new RangeError(
        'koa-rejwt: The refresh time of the token must be less than its expiration time and greater than zero'
    )
}

var index = options => {
    verifyParams(options)
    const stateObjKey = defaultValue(options.stateObjKey, 'payload')
    const credentialsRequired = defaultValue(options.credentialsRequired, true)
    const getSignSecret = getSecretValue(options?.secret, options?.signSecret)
    const getVerifySecret = getSecretValue(options?.secret)
    const { getToken, isRevoked, onExpired, signOptions } = options
    const middleware = async (ctx, next) => {
        try {
            const token =
                getToken && isFunction(getToken)
                    ? await getToken(ctx)
                    : resolveHeader(ctx, credentialsRequired)
            if (!token) {
                if (credentialsRequired) {
                    ctx.throw(401, UnauthorizedError['credentials_required'])
                } else {
                    return next()
                }
            } else {
                const decodedToken = jsonwebtoken.decode(token, { complete: true })
                const verifySecret = await getVerifySecret(ctx, decodedToken)
                if (!decodedToken) {
                    throw new jsonwebtoken.JsonWebTokenError('jwt malformed')
                }
                if (!verifySecret) {
                    throw new ReferenceError('`verifySecret` is undefined')
                }
                isRevoked &&
                    isFunction(isRevoked) &&
                    (await isRevoked(ctx, decodedToken)) &&
                    ctx.throw(401, UnauthorizedError['revoked_token'])
                await verifyToken(token, verifySecret, options)
                // By default, the decodedToken is assigned to ctx.state['payload']
                ctx.state[stateObjKey] = decodedToken.payload
                await next()
                // The refreshed token can be captured by the client response interceptor
                if (options?.reftime) {
                    const reftime =
                        typeof options?.reftime === 'string'
                            ? ms(options?.reftime) / 1000
                            : typeof options?.reftime === 'number'
                            ? options?.reftime
                            : undefined
                    const signSecret = await getSignSecret(ctx, decodedToken)
                    if (!signSecret) {
                        throw new ReferenceError('`signSecret` is undefined')
                    }
                    typeof reftime === 'number' &&
                        reftime > 0 &&
                        reftime < Number.MAX_SAFE_INTEGER &&
                        refreshToken(ctx, reftime, decodedToken, signSecret, signOptions)
                }
            }
        } catch (error) {
            onExpired &&
                isFunction(onExpired) &&
                error instanceof jsonwebtoken.TokenExpiredError &&
                (await onExpired(ctx, error))
            if (error instanceof jsonwebtoken.TokenExpiredError) {
                ctx.throw(401, UnauthorizedError['expired_token'])
            } else if (error instanceof jsonwebtoken.JsonWebTokenError) {
                ctx.throw(401, UnauthorizedError['invalid_token'])
            } else if (error instanceof jsonwebtoken.NotBeforeError) {
                ctx.throw(401, UnauthorizedError['not_activated_token'])
            } else {
                throw error
            }
        }
    }
    middleware.unless = unless
    return middleware
}

module.exports = index
