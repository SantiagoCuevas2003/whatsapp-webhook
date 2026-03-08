const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

const verifyToken = process.env.VERIFY_TOKEN;
const apiVersion = 'v22.0';
const businessPhone = process.env.PHONE_NUMBER_ID;

// function to send message
async function sendMessage(phoneNumber, message) {

  const url = `https://graph.facebook.com/${apiVersion}/${businessPhone}/messages`;

  const data = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    text: { body: message }
  };

  try {

    const response = await axios.post(url, data, {
      headers: {
        "Authorization": `Bearer ${process.env.API_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Message sent:", response.data);

  } catch (error) {

    console.error("Error sending message:", error.response?.data || error.message);

  }

}


// webhook verification
app.get('/', (req, res) => {

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {

    console.log("WEBHOOK VERIFIED");
    res.status(200).send(challenge);

  } else {

    res.status(403).end();

  }

});


// receive messages
app.post('/', async (req, res) => {

  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  console.log(`Webhook received ${timestamp}`);
  console.log(JSON.stringify(req.body, null, 2));

  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (message && message.type === "text") {

    const phoneNumber = message.from;
    const text = message.text.body;

    console.log(`Received message from ${phoneNumber}: ${text}`);

    const responseMessage = `You said: ${text}`;

    await sendMessage(phoneNumber, responseMessage);

  }

  res.status(200).end();

});

app.listen(port, () => {

  console.log(`Listening on port ${port}`);

});