import { decode, TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken'
import ms from 'ms'
import unless from 'koa-unless'
import {
    isFunction,
    defaultValue,
    getSecretValue,
    verifyParams,
    resolveHeader,
    verifyToken,
    refreshToken
} from './process'
import { GetSecret, OptionsType } from './utils/optionsType'
import { UnauthorizedError } from './utils/unauthorizedError'

export default (options: OptionsType) => {
    verifyParams(options)
    const stateObjKey = defaultValue(options.stateObjKey, 'payload')
    const credentialsRequired = defaultValue(options.credentialsRequired, true)
    const getSignSecret: GetSecret = getSecretValue(options?.secret, options?.signSecret)
    const getVerifySecret: GetSecret = getSecretValue(options?.secret)
    const { getToken, isRevoked, onExpired, signOptions } = options
    const middleware = async (ctx: any, next: any) => {
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
                const decodedToken = decode(token, { complete: true })
                const verifySecret = await getVerifySecret(ctx, decodedToken)
                if (!decodedToken) {
                    throw new JsonWebTokenError('jwt malformed')
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
        } catch (error: any) {
            onExpired &&
                isFunction(onExpired) &&
                error instanceof TokenExpiredError &&
                (await onExpired(ctx, error))
            if (error instanceof TokenExpiredError) {
                ctx.throw(401, UnauthorizedError['expired_token'])
            } else if (error instanceof JsonWebTokenError) {
                ctx.throw(401, UnauthorizedError['invalid_token'])
            } else if (error instanceof NotBeforeError) {
                ctx.throw(401, UnauthorizedError['not_activated_token'])
            } else {
                throw error
            }
        }
    }
    middleware.unless = unless
    return middleware
}
