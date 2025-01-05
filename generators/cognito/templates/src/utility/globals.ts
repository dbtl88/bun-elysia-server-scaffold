const cognitoUrl = process.env.COGNITO_URL
const cognitoRedirectUri = process.env.COGNITO_REDIRECT_URI
const cognitoClientId = process.env.USER_POOL_CLIENT_ID

export const cognitoTokenUrl = `${cognitoUrl}/oauth2/token`
export const cognitoTokenCallBody = (code: string) => {
    return `redirect_uri=${cognitoRedirectUri}&client_id=${cognitoClientId}&grant_type=authorization_code&code=${code}`
}

export const cognitoRefreshCallBody = (refresh: string) => {
    return `client_id=${cognitoClientId}&grant_type=refresh_token&refresh_token=${refresh}`
}