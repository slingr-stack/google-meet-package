/****************************************************
 Dependencies
 ****************************************************/

let httpReference = dependencies.http;

let httpDependency = {
    get: httpReference.get,
    post: httpReference.post,
    put: httpReference.put,
    patch: httpReference.patch,
    delete: httpReference.delete
};

let httpService = {};

/**
 *
 * Handles a request with retry from the platform side.
 */
function handleRequestWithRetry(requestFn, options, callbackData, callbacks) {
    try {
        return requestFn(options, callbackData, callbacks);
    } catch (error) {
        sys.logs.info("[googlemeet] Handling request..."+ JSON.stringify(error));
        if (error.additionalInfo.status === 401) {
            if (config.get("authenticationMethod") === 'oAuth2') {
                dependencies.oauth.functions.refreshToken('googlemeet:refreshToken');
            } else {
                getAccessTokenForAccount(); // this will attempt to get a new access_token in case it has expired
            }
            return requestFn(setAuthorization(options), callbackData, callbacks);
        } else {
            throw error;
        }

    }
}

function createWrapperFunction(requestFn) {
    return function(options, callbackData, callbacks) {
        return handleRequestWithRetry(requestFn, options, callbackData, callbacks);
    };
}

for (let key in httpDependency) {
    if (typeof httpDependency[key] === 'function') httpService[key] = createWrapperFunction(httpDependency[key]);
}

/**
 * Retrieves the access token.
 *
 * @return {void} The access token refreshed on the storage.
 */
exports.getAccessToken = function () {
    sys.logs.info("[googlemeet] Getting access token");
    if (config.get("authenticationMethod") === "oAuth2") {
        return dependencies.oauth.functions.connectUser("googlemeet:userConnected");
    } else if (config.get("authenticationMethod") === "serviceAccount") {
        return getAccessTokenForAccount();
    }
}

/**
 * Removes the access token from the oauth.
 *
 * @return {void} The access token removed on the storage.
 */
exports.removeAccessToken = function () {
    if (config.get("authenticationMethod") === "oAuth2") {
        sys.logs.info("[googlemeet] Removing access token from oauth");
        return dependencies.oauth.functions.disconnectUser("googlemeet:disconnectUser");
    } else {
        sys.storage.remove('installationInfo-googlemeet-User-'+  sys.context.getCurrentUserRecord().id());
    }
}

/****************************************************
 Public API - Generic Functions
 ****************************************************/

/**
 * Sends an HTTP GET request to the specified URL with the provided HTTP options.
 *
 * @param {string} path         - The path to send the GET request to.
 * @param {object} httpOptions  - The options to be included in the GET request check http-service documentation.
 * @param {object} callbackData - Additional data to be passed to the callback functions. [optional]
 * @param {object} callbacks    - The callback functions to be called upon completion of the GET request. [optional]
 * @return {object}             - The response of the GET request.
 */
exports.get = function(path, httpOptions, callbackData, callbacks) {
    let options = checkHttpOptions(path, httpOptions);
    return httpService.get(GoogleMeet(options), callbackData, callbacks);
};

/**
 * Sends an HTTP POST request to the specified URL with the provided HTTP options.
 *
 * @param {string} path         - The path to send the POST request to.
 * @param {object} httpOptions  - The options to be included in the POST request check http-service documentation.
 * @param {object} callbackData - Additional data to be passed to the callback functions. [optional]
 * @param {object} callbacks    - The callback functions to be called upon completion of the POST request. [optional]
 * @return {object}             - The response of the POST request.
 */
exports.post = function(path, httpOptions, callbackData, callbacks) {
    let options = checkHttpOptions(path, httpOptions);
    return httpService.post(GoogleMeet(options), callbackData, callbacks);
};

/**
 * Sends an HTTP PUT request to the specified URL with the provided HTTP options.
 *
 * @param {string} path         - The path to send the PUT request to.
 * @param {object} httpOptions  - The options to be included in the PUT request check http-service documentation.
 * @param {object} callbackData - Additional data to be passed to the callback functions. [optional]
 * @param {object} callbacks    - The callback functions to be called upon completion of the POST request. [optional]
 * @return {object}             - The response of the PUT request.
 */
exports.put = function(path, httpOptions, callbackData, callbacks) {
    let options = checkHttpOptions(path, httpOptions);
    return httpService.put(GoogleMeet(options), callbackData, callbacks);
};

/**
 * Sends an HTTP PATCH request to the specified URL with the provided HTTP options.
 *
 * @param {string} path         - The path to send the PATCH request to.
 * @param {object} httpOptions  - The options to be included in the PATCH request check http-service documentation.
 * @param {object} callbackData - Additional data to be passed to the callback functions. [optional]
 * @param {object} callbacks    - The callback functions to be called upon completion of the POST request. [optional]
 * @return {object}             - The response of the PATCH request.
 */
exports.patch = function(path, httpOptions, callbackData, callbacks) {
    let options = checkHttpOptions(path, httpOptions);
    return httpService.patch(GoogleMeet(options), callbackData, callbacks);
};

/**
 * Sends an HTTP DELETE request to the specified URL with the provided HTTP options.
 *
 * @param {string} path         - The path to send the DELETE request to.
 * @param {object} httpOptions  - The options to be included in the DELETE request check http-service documentation.
 * @param {object} callbackData - Additional data to be passed to the callback functions. [optional]
 * @param {object} callbacks    - The callback functions to be called upon completion of the DELETE request. [optional]
 * @return {object}             - The response of the DELETE request.
 */
exports.delete = function(path, httpOptions, callbackData, callbacks) {
    let options = checkHttpOptions(path, httpOptions);
    return httpService.delete(GoogleMeet(options), callbackData, callbacks);
};

/****************************************************
 Private helpers
 ****************************************************/

function checkHttpOptions (path, options) {
    options = options || {};
    if (!!path) {
        if (isObject(path)) {
            // take the 'path' parameter as the options
            options = path || {};
        } else {
            if (!!options.path || !!options.params || !!options.body) {
                // options contain the http package format
                options.path = path;
            } else {
                // create html package
                options = {
                    path: path,
                    body: options
                }
            }
        }
    }
    return options;
}

function isObject (obj) {
    return !!obj && stringType(obj) === '[object Object]'
}

let stringType = Function.prototype.call.bind(Object.prototype.toString)

/****************************************************
 Constants
 ****************************************************/

const GOOGLEWORKSPACE_API_AUTH_URL = "https://oauth2.googleapis.com/token";

/****************************************************
 Configurator
 ****************************************************/

let GoogleMeet = function (options) {
    options = options || {};
    options= setApiUri(options);
    options= setRequestHeaders(options);
    options = setAuthorization(options);
    return options;
}

/****************************************************
 Private API
 ****************************************************/

function setApiUri(options) {
    if (options.url) return options;
    let API_URL = config.get("GOOGLEMEET_API_BASE_URL");
    let url = options.path || "";
    options.url = API_URL + url;
    sys.logs.debug('[googlemeet] Set url: ' + options.path + "->" + options.url);
    return options;
}

function setRequestHeaders(options) {
    let headers = options.headers || {};
    headers = mergeJSON(headers, {"Content-Type": "application/json"});
    options.headers = headers;
    return options;
}

function setAuthorization(options) {
    sys.logs.debug('[googlemeet] setting authorization');
    if (config.get("authenticationMethod") === "oAuth2") {
        let authorization = options.authorization || {};
        authorization = mergeJSON(authorization, {
            type: "oauth2",
            accessToken: sys.storage.get(
                'installationInfo-googlemeet-User-'+sys.context.getCurrentUserRecord().id() + ' - access_token',{decrypt:true}),
            headerPrefix: "Bearer"
        });
        options.authorization = authorization;
        return options;
    } else {
        options.headers = mergeJSON(options.headers, {"Authorization": "Bearer " + getAccessTokenForAccount()});
        return options;
    }
}

function getAccessTokenForAccount() {
    sys.logs.info('[googlemeet] Getting access token for account: '+ sys.context.getCurrentUserRecord().id());
    let installationJson = sys.storage.get('installationInfo-googlemeet-User-'+  sys.context.getCurrentUserRecord().id()) || {id: null};
    let token = installationJson.token || null;
    let expiration = installationJson.expiration || 0;
    if (!token || expiration < new Date()) {
        sys.logs.info('[googlemeet] Access token is expired or not found. Getting new token');
        let res = httpService.post(
            {
                url: "https://oauth2.googleapis.com/token",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: {
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: getJsonWebToken()
                }
            });
        token = res.access_token;
        let expires_at = res.expires_in;
        expiration = expires_at * 1000 +  + new Date().getTime();
        installationJson = mergeJSON(installationJson, {"token": token, "expiration": expiration});
        sys.logs.info('[googlemeet] Saving new token for account: ' + sys.context.getCurrentUserRecord().id());
        sys.storage.put('installationInfo-googlemeet-User-'+  sys.context.getCurrentUserRecord().id(), installationJson);
    }
    return token;
}

function getJsonWebToken() {
    try{
        let currentTime = new Date().getTime();
        let futureTime = new Date(currentTime + ( 10 * 60 * 1000)).getTime();
        let scopes = config.get("authScopes");
        return sys.utils.crypto.jwt.generate(
            {
                iss: config.get("serviceAccountEmail"),
                aud: GOOGLEWORKSPACE_API_AUTH_URL,
                scope: scopes,
                iat: currentTime,
                exp: futureTime
            },
            config.get("privateKey"),
            "RS256"
        );
    } catch (error) {
        sys.logs.error("[googlemeet] Error generating JWT: ", error);
    }
}

function mergeJSON (json1, json2) {
    const result = {};
    let key;
    for (key in json1) {
        if(json1.hasOwnProperty(key)) result[key] = json1[key];
    }
    for (key in json2) {
        if(json2.hasOwnProperty(key)) result[key] = json2[key];
    }
    return result;
}
