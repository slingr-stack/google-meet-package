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
        sys.logs.info('[googlemeet] Received Google Meet webhook. Processing and triggering a package event.', event);
        sys.events.triggerEvent('googlemeet:webhook', event.data);
    }
};