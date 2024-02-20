/****************************************************
 Listeners
 ****************************************************/

listeners.defaultWebhookGoogleMeet = {
    label: 'Catch HTTP Google Meet events',
    type: 'service',
    options: {
        service: 'http',
        event: 'webhook',
        matching: {
            path: '/googlemeet',
        }
    },
    callback: function(event) {
        sys.logs.info('Received Google Meet webhook. Processing and triggering a package event.');
        var body = JSON.stringify(event.data.body);
        var params = event.data.parameters;
        if(true) {
            sys.logs.info('Valid webhook received. Triggering event.');
            sys.events.triggerEvent('googlemeet:webhook', {
                body: body,
                params: params
            });
            return "ok";
        }
        else throw new Error("Invalid webhook");
    }
};
