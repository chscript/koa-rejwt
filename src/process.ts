import { UnauthorizedError } from './utils/unauthorizedError'
import { Jwt, sign, verify, Secret, JwtPayload, VerifyOptions, SignOptions } from 'jsonwebtoken'

export const isFunction = (func: any): boolean => {
    return typeof func === 'function'
}

export const defaultValue = (param: any, value: any) => {
    return param === undefined ? value : param
}

export const getSecretValue = (secret: any, temp?: any) => {
    temp = defaultValue(temp, secret)
    return typeof temp === 'function' ? temp : async () => secret as Secret
}

export const verifyParams = (options: any) => {
    if (!options.secret) {
        throw new RangeError('koa-rejwt: `secret` is a required option')
    }
}

export const resolveHeader = (ctx: any, credentialsRequired: boolean): string | undefined => {
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

export const verifyToken = (
    token: string,
    secret: Secret,
    verifyOptions: VerifyOptions | undefined
): Promise<void> => {
    return new Promise((resolve, reject) => {
        verify(token, secret, verifyOptions, (error: any) => {
            error ? reject(error) : resolve()
        })
    })
}

export const refreshToken = (
    ctx: any,
    reftime: number,
    decodedToken: Jwt,
    secret: Secret,
    signOptions: SignOptions | undefined
) => {
    const curtime = Math.floor(Date.now() / 1000)
    const { exp, iat, nbf, jti, ...payload } = decodedToken?.payload as JwtPayload
    if (exp && iat && reftime < exp - iat) {
        if (reftime <= curtime - iat) {
            ctx.response.set(
                'authorization',
                sign({ iat: curtime, exp: curtime + exp - iat, ...payload }, secret, signOptions)
            )
            // console.log(ctx.response.headers['authorization'])
        }
        return
    }
    throw new RangeError(
        'koa-rejwt: The refresh time of the token must be less than its expiration time and greater than zero'
    )
}
