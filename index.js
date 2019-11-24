
/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger Platform Quick Start Tutorial
 *
 * This is the completed code for the Messenger Platform quick start tutorial
 *
 * https://developers.faceook.com/docs/messenger-platform/getting-started/quick-start/
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

'use strict';
const PAGE_ACCESS_TOKEN = process.env.EAAHFzsBUAFcBACKIELF4PVb95ZBz2NA3e3NtZANS7ifvJw8shKBFp7kfjHap3i0ariDehmZCOtLuIK2xjZCojmVJDQXeZAq6vsCkLwYis09p7AWsmJ0wllmt1GubPZCb1fvaeZBlEbcZBMxWlLTJUcZCjgmG1cLX8WkHjHN7f701ZCN91ZCN5H0gBgZA;
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  fetch = require('node-fetch'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
app.use(body_parser.json({verify: verifyRequestSignature}));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(['webhook_event'], webhook_event);
      console.log(['webhook_event.message'], webhook_event.message);


      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender ID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);   
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
      
    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Server index page
app.get("/", function (req, res) {
  res.send("Deployed!");
});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "87192937141fa";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', d5bb569f942017c4aa31764cd049aa17)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

function handleMessage(sender_psid, received_message) {
    let response;
    console.log(['obj'], received_message);
    // Checks if the message contains text
    if (received_message.text) { 
      console.log('[handleMessage.text]', recieved_message.text);   
      handlePostback(sender_psid, received_message.text)
    } else if (received_message.attachments) {
      // Get the URL of the message attachment
      let attachment_url = received_message.attachments[0].payload.url;
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Is this the right picture?",
              "subtitle": "Tap a button to answer.",
              "image_url": attachment_url,
              "buttons": [
                {
                  "type": "postback",
                  "title": "Yes!",
                  "payload": "yes",
                },
                {
                  "type": "postback",
                  "title": "No!",
                  "payload": "no",
                }
              ],
            }]
          }
        }
      }
    } 
    
    // Send the response message
    callSendAPI(sender_psid, response);    
}

function handlePostback(sender_psid, received_postback) {
  let response;
  // Get the payload for the postback
  let payload = received_postback.payload;
  let ageLim = "18";
  console.log('[handlePostback, receivedpostback]', received_postback);
  if (payload === 'Get Started') {
      sendGetStarted(sender_psid);
      console.log('[switch case[Get Started]] - reached');
  } else if (typeof payload == 'number') {
   let paynum = parseInt(payload);
   if (paynum >= 18) {
    sendVenueCheck(sender_psid);
   } else {
     sendSorry(sender_psid);
   }
  }
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(sender_psid, messageText) {
  console.log('sendTextMessage', messageText);
  let response;
  response = {
    "message": {
      "text": messageText,
    }
  };
  callSendAPI(sender_psid, messageText);
}

function sendGetStarted(sender_psid) {
  let response;
  let response2;
  console.log('sendGetStarted');
  response = {
      "text": "Hey! Welcome to the Hunry Horse - Jack Daniels Honey Ultimate Summer Pass. We need a couple of details from you to get started..."
  };
  response2 = {
    "text": "How old are you?"
  };
  callSendAPI(sender_psid, response).then(() => {
    console.log('.then retrun callSendAPI called');
    return callSendAPI(sender_psid, response2);
  });
};

// After RESPONSE = AGE > 18
function sendVenueCheck(sender_psid) {
  let response; 
  console.log('sendVenueCheck');
  response = {
    "text": "Great!"
  };
  response2 = {
    "text": "Just so I can send you the best deals around, can you tell me which venue you are in?"
  };
  callSendAPI(sender_psid, response).then(() => {
    console.log('.then return callSendAPI sendVenueCheck Called');
    return callSendAPI(sender_psid, response2);
  });
};

function sendSorry(sender_psid) {
  console.log('[sendSorry] = called');
  let response; 
  response = {
    "text": "I'm sorry, you have to be over 18 to be able to talk to me."
  };
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  console.log('callSendAPI function was called', response);
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  };
  console.log('[request_body]', request_body);

  const qs = 'access_token=' + encodeURIComponent("EAAHFzsBUAFcBACKIELF4PVb95ZBz2NA3e3NtZANS7ifvJw8shKBFp7kfjHap3i0ariDehmZCOtLuIK2xjZCojmVJDQXeZAq6vsCkLwYis09p7AWsmJ0wllmt1GubPZCb1fvaeZBlEbcZBMxWlLTJUcZCjgmG1cLX8WkHjHN7f701ZCN91ZCN5H0gBgZA");
  return fetch("https://graph.facebook.com/me/messages?" + qs, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(request_body),
  }).then(res => res.json()).then(json => console.log(json));
  // // Send the HTTP request to the Messenger Platform
  // request({
  //   "uri": "https://graph.facebook.com/v2.6/me/messages",
  //   "qs": { "access_token": "EAAHFzsBUAFcBACKIELF4PVb95ZBz2NA3e3NtZANS7ifvJw8shKBFp7kfjHap3i0ariDehmZCOtLuIK2xjZCojmVJDQXeZAq6vsCkLwYis09p7AWsmJ0wllmt1GubPZCb1fvaeZBlEbcZBMxWlLTJUcZCjgmG1cLX8WkHjHN7f701ZCN91ZCN5H0gBgZA" },
  //   "method": "POST",
  //   "json": request_body
  // }, (err, res, body) => {
  //   if (!err) {
  //     console.log('message sent!');
  //   } else {
  //     console.error("Unable to send message:" + err);
  //   }
  // }); 
};
// }

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;