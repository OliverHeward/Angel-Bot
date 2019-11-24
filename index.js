/**
 *
 * To run this code, you must do the following:
 *
 * 1. Deploy this code to a server running Node.js
 * 2. Run `npm install`
 * 3. Update the VERIFY_TOKEN
 * 4. Add your PAGE_ACCESS_TOKEN to your environment vars
 *
 */

"use strict";
const PAGE_ACCESS_TOKEN =
  process.env
    .EAAHFzsBUAFcBACKIELF4PVb95ZBz2NA3e3NtZANS7ifvJw8shKBFp7kfjHap3i0ariDehmZCOtLuIK2xjZCojmVJDQXeZAq6vsCkLwYis09p7AWsmJ0wllmt1GubPZCb1fvaeZBlEbcZBMxWlLTJUcZCjgmG1cLX8WkHjHN7f701ZCN91ZCN5H0gBgZA;
// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  fetch = require("node-fetch"),
  body_parser = require("body-parser"),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));
app.use(body_parser.json({ verify: verifyRequestSignature }));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      // Gets the body of the webhook event
      // Wil lonly ever contain one event, so we get index [0]
      let webhook_event = entry.messaging[0];
      console.log("[webhook_event]", webhook_event);
      console.log("[webhook_event.message]", webhook_event.message);
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      let sender_name = webhook_event.sender.first_name;
      let sender_lname = webhook_event.sender.last_name;
      console.log("Sender ID: " + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        console.log(
          "[webhook_event.message] catch block",
          webhook_event.message
        );
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback, sender_name, sender_lname);
      }
    });
    // Return a '200 OK' response to all events
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Server index page
app.get("/", function(req, res) {
  res.send("Deployed!");
});

// Accepts GET requests at the /webhook endpoint
app.get("/webhook", (req, res) => {
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "87192937141fa";

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
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
    var elements = signature.split("=");
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto
      .createHmac("sha1", d5bb569f942017c4aa31764cd049aa17)
      .update(buf)
      .digest("hex");

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

function handleMessage(sender_psid, received_message) {
  let response;
  console.log(["obj"], received_message);
  // Checks if the message contains text
  if (received_message.text) {
    console.log("[handleMessage.text]", received_message.text);
    handlePostback(sender_psid, received_message.text);
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes"
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no"
                }
              ]
            }
          ]
        }
      }
    };
  }

  // Send the response message
  callSendAPI(sender_psid, response);
}

function handlePostback(sender_psid, received_postback, name, lname) {
  let response;
  // Get the payload for the postback
  let message = received_postback;
  let payload = received_postback.payload;
  console.log("[handlePostback, receivedpostback]", received_postback);
  switch (payload) {
    case "Get Started":
      sendGetStarted(sender_psid);
      break;
    // Maybe add a value variable for each and check it isn't currently 1 to prevent spamming.
    case "Claim offer":
      handleClaimNow(sender_psid);
      break;
    case "Redeem now":
      handleRedeemNow(sender_psid);
      break;
    case "Enter now":
      handleEnterNow(sender_psid);
      break;
    //Button Cases
    case "yes email":
      handleEntry(sender_psid, received)
      break;
    // Maybe ask for email again
    case "no email":
      break;
    default:
      break;
  }
  if (message != "" && !payload) {
    let age = Number(received_postback);
    if (age >= 18) {
      sendVenueCheck(sender_psid);
    } else if (age < 18) {
      sendSorry(sender_psid);
    } else if (message === "The Fox Under the Hill") {
      console.log("payload === venue name");
      sendDeals(sender_psid);
    } else if (message.includes("@")) {
      handleEmail(sender_psid, message, name, lname);
    }
  }
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(sender_psid, messageText) {
  console.log("sendTextMessage", messageText);
  let response;
  response = {
    text: messageText
  };
  callSendAPI(sender_psid, response);
}

function sendGetStarted(sender_psid) {
  let response;
  let response2;
  console.log("sendGetStarted");
  response = {
    text:
      "Hey! Welcome to the Hunry Horse - Jack Daniels Honey Ultimate Summer Pass. We need a couple of details from you to get started..."
  };
  response2 = {
    text: "How old are you?"
  };
  callSendAPI(sender_psid, response).then(() => {
    console.log(".then retrun callSendAPI called");
    return callSendAPI(sender_psid, response2);
  });
}

// After RESPONSE = AGE > 18
function sendVenueCheck(sender_psid) {
  let response;
  let response2;
  console.log("sendVenueCheck");
  response = {
    text: "Great!"
  };
  response2 = {
    text:
      "Just so I can send you the best deals around, can you tell me which venue you are in?"
  };
  callSendAPI(sender_psid, response).then(() => {
    console.log(".then return callSendAPI sendVenueCheck Called");
    return callSendAPI(sender_psid, response2);
  });
}

function sendDeals(sender_psid) {
  let response, response2, response3;
  response = {
    text: "Cheers!"
  };
  response2 = {
    text:
      "Now you can check out the exclusive serves, offers and competitions below - chosen just for you."
  };
  response3 = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: [
          {
            title: "Claim your 2-4-1 Jack Daniels Honey & Lemonades",
            image_url:
              "https://i.pinimg.com/originals/47/b3/db/47b3db82d07d3bc684c221bdd196c1b7.jpg",
            buttons: [
              {
                type: "postback",
                title: "Claim offer",
                payload: "Claim offer"
              }
            ]
          },
          {
            title: "Redeem a FREE meal & drink*",
            image_url:
              "https://eatdrinkplay.com/wp-content/uploads/2012/07/4256_-23995-1.jpg",
            subtitle: "*Available only between 4-7pm",
            buttons: [
              {
                type: "postback",
                title: "Redeem now",
                payload: "Redeem now"
              }
            ]
          },
          {
            title:
              "Enter our competition for a chance to WIN an ultimate CITY BREAK",
            image_url:
              "https://images.wowcher.co.uk/images/deal/8929303/777x520/376078.jpg",
            buttons: [
              {
                type: "postback",
                title: "Enter now",
                payload: "Enter now"
              }
            ]
          }
        ]
      }
    }
  };
  callSendAPI(sender_psid, response).then(() => {
    return callSendAPI(sender_psid, response2).then(() => {
      return callSendAPI(sender_psid, response3);
    });
  });
}

// Handle the Claim Now Payload
function handleClaimNow(sender_psid) {
  let response, response2, response3;
  response = {
    text: "Great choice!"
  };
  //
  response2 = {
    text:
      "Here's your QR code for 2-4-1 Jack Daniel's Honey & Lemonades. Show it at the bar to redeem. Enjoy!"
  };
  // This will need to be changed to a request to an endpoint to retrieve a QR Code
  response3 = {
    attachment: {
      type: "image",
      payload: {
        url:
          "https://images.samsung.com/is/image/samsung/p5/au/faq/os-pie-updates/QR-code.png"
      }
    }
  };
  callSendAPI(sender_psid, response).then(() => {
    return callSendAPI(sender_psid, response2).then(() => {
      return callSendAPI(sender_psid, response3);
    });
  });
}
// Handle the Redeem Now Payload
function handleRedeemNow(sender_psid) {
  let response, response2, response3, date;
  date = Date.now();
  if (date.getHours() > 16 && date.getHours() < 19) {
    // Send QR Code for Deal or Code of some form
    response = {
      text: "Great decision!"
    };
    response2 = {
      text: "Here's your QR code for a Meal and Drink on Jack!"
    };
    // This will need to be changed to a request to an endpoint to retrieve a QR Code
    response3 = {
      attachment: {
        type: "image",
        payload: {
          url:
            "https://images.samsung.com/is/image/samsung/p5/au/faq/os-pie-updates/QR-code.png"
        }
      }
    };
    callSendAPI(sender_psid, response).then(() => {
      return callSendAPI(sender_psid, response2).then(() => {
        return callSendAPI(sender_psid, response3);
      });
    });
  } else {
    // Send a notice saying that the hours aren't between 4-7 are they sure they want this
    response = {
      text: "Ohh, this code is only valid between 4 - 7pm!"
    };
    response2 = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Are you sure you wish to continue?",
          buttons: [
            {
              type: "postback",
              title: "Yes, its for later",
              payload: "yes"
            },
            {
              type: "postback",
              title: "No",
              payload: "no"
            }
          ]
        }
      }
    };
    callSendAPI(sender_psid, response).then(() => {
      return callSendAPI(sender_psid, response2);
    });
  }
}
// Handle the Redeem Now Payload
function handleEnterNow(sender_psid) {
  let response, response2;
  response = {
    text: "Wise move! For us to be able to process your entry, we will need a few details from you first..."
  };
  response2 = {
    text: "What is your best email address so we can inform you of your result?"
  };
  callSendAPI(sender_psid, response).then(() => {
    return callSendAPI(sender_psid, response2)
  }) 
}

// Handle Email response from user
function handleEmail(sender_psid, email, name) {
  let response, response2;
  response = {
    text: "Thank you "+name+". Can you tell us if this is the correct email address?"
  };
  // Check this is the correct email by posting it back to them
  response2 = {
    attachment: {
      type: "template",
      payload: {
        template_type: "button",
        text: email,
        buttons: [
          {
            type: "postback",
            title: "Yes thats it!",
            payload: "yes email"
          },
          {
            type: "postback",
            title: "No?",
            payload: "no email"
          }
        ]
      }
    }
  };
  callSendAPI(sender_psid, response).then(() => {
    return callSendAPI(sender_psid, response2);
  });
}

function sendSorry(sender_psid) {
  console.log("[sendSorry] = called");
  let response;
  response = {
    text: "I'm sorry, you have to be over 18 to be able to talk to me."
  };
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  // Construct the message body
  console.log("callSendAPI function was called", response);
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };
  console.log("[request_body]", request_body);

  const qs =
    "access_token=" +
    encodeURIComponent(
      "EAAHFzsBUAFcBACKIELF4PVb95ZBz2NA3e3NtZANS7ifvJw8shKBFp7kfjHap3i0ariDehmZCOtLuIK2xjZCojmVJDQXeZAq6vsCkLwYis09p7AWsmJ0wllmt1GubPZCb1fvaeZBlEbcZBMxWlLTJUcZCjgmG1cLX8WkHjHN7f701ZCN91ZCN5H0gBgZA"
    );
  return fetch("https://graph.facebook.com/me/messages?" + qs, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request_body)
  })
    .then(res => res.json())
    .then(json => console.log(json));
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
}
// }

app.listen(app.get("port"), function() {
  console.log("Node app is running on port", app.get("port"));
});

module.exports = app;
