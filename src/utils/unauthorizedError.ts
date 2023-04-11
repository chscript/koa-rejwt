export type UnauthorizedError =
    | {
          name: string
          message: string
      }
    | string

export const UnauthorizedError = new Proxy(
    {
        credentials_required: 'No authorization token was found',
        credentials_bad_format: 'Format is Authorization: Bearer [token]',
        expired_token: 'The received token has expired',
        invalid_token: 'The received token is invalid',
        not_activated_token: 'The token received is not activated',
        revoked_token: 'The received token has been revoked'
    },
    {
        get: (target: { [key: string]: string }, propKey: string) => {
            return `${propKey} : ${target[propKey]}`
        }
    }
)
