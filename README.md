# gardena2mqtt made for Docker and Node.js
## Summary
Gardena's Smart Garden websocket changes its URL after each disconnect/connect loss. This tool determins 
the new URL and reconnects on connection loss/disconnect. All incoming websocket messages are forwarded to the mqtt 
broker of your choice.
## What you need
### Required
- You need your **username** and **password** of the Gardena cloud account as well as an **API key**. You can receive 
your API key at *[GARDENA Smart System API](https://developer.husqvarnagroup.cloud/apis/GARDENA+smart+system+API)*. 
Use your Gardena cloud account to log in.
- The **URL** and **port** of your MQTT broker as well as an **topic** for MQTT messages.
### Optional
If you intend to use mTLS for MQTT you additionally need a **client certificate** and **private key** as 
well as **root CA certificate**.
