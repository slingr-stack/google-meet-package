/****************************************************
 Configuration builder

 The configuration object should be built to configure the package dependencies

 ****************************************************/

let configurationBuilder = function (config) {
    if (config.authenticationMethod === 'oAuth2') {
        config.oauth = {
            id: 'installationInfo-googlemeet-User-'+sys.context.getCurrentUserRecord().id(),
            authUrl: 'https://accounts.google.com/o/oauth2/auth',
            accessTokenUrl: 'https://oauth2.googleapis.com/token',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            scope: config.authScopes,
            oauthCallback: config.oauthCallback
        };
    }
    return config;
}