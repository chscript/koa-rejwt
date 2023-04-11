import { Jwt, Secret, SignOptions, VerifyOptions, TokenExpiredError } from 'jsonwebtoken'

export type GetSecret = (
    ctx: any,
    decodedToken: Jwt | null
) => Secret | undefined | Promise<Secret | undefined>

type GetToken = (ctx: any) => string | Promise<string>
type IsRevoked = (ctx: any, decodedToken: Jwt | null) => boolean | Promise<boolean>
type OnExpired = (ctx: any, error: TokenExpiredError) => void | Promise<void>

export type OptionsType = {
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
