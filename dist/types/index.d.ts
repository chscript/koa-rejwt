import { Secret, SignOptions, VerifyOptions, Jwt, TokenExpiredError } from 'jsonwebtoken'

type GetSecret = (
    ctx: any,
    decodedToken: Jwt | null
) => Secret | undefined | Promise<Secret | undefined>
type GetToken = (ctx: any) => string | Promise<string>
type IsRevoked = (ctx: any, decodedToken: Jwt | null) => boolean | Promise<boolean>
type OnExpired = (ctx: any, error: TokenExpiredError) => void | Promise<void>
type OptionsType = {
    secret: Secret | GetSecret
    reftime?: string | number
    signSecret?: Secret | GetSecret
    signOptions?: SignOptions
    getToken?: GetToken
    isRevoked?: IsRevoked
    onExpired?: OnExpired
    stateObjKey?: string
    credentialsRequired?: boolean
} & VerifyOptions

declare const _default: (options: OptionsType) => {
    (ctx: any, next: any): Promise<any>
    unless: any
}

export { _default as default }
