# gardena-api-client
Queries Gardena Smart Garden API for status updates on your Smart Gardening devices. To do so the client determines the
dynamically generated websocket URL based on your API key and login credentials.
## Remarks
The client automatically recovers from connection or network loss. In case you change your login credentials of the 
Gardena cloud or change the API key you have to adapt your local configuration (see usage examples below).
## Prerequisites
You need your login (username and password) for your Gardena System to create an API key here:
[GARDENA Smart System API](https://developer.husqvarnagroup.cloud/apis/GARDENA+smart+system+API)
## Usage
### Quickstart
```javascript
import * as gardena from 'gardena-api-client'

const options = {
    username: "your.name@provider.com",
    password: "pa$$w0rd",
    apikey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    log: (entry) => console.log(entry),
    callback: (message) => console.log(message)
}

gardena.connect(options)
```
### Details
Once installed and imported simply call the ```connect(options)``` and hand in the configuration object.

```javascript
const options = { }
```
* ```username``` [text]: Login to Gardena cloud (your e-mail address)
* ```password```[text]: Password for Gardena cloud login
* ```apikey```[text]: API key from [GARDENA Smart System API](https://developer.husqvarnagroup.cloud/apis/GARDENA+smart+system+API)
* ```log``` [function]: Callback function for log messages
* ```callback``` [function]: Callback function for Gardena device updates
### Callback Examples
```javascript
import * as gardena from 'gardena-api-client'

const options = {
    username: "your.name@provider.com",
    password: "pa$$w0rd",
    apikey: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    log: onLog,
    callback: onMessage
}

/**
 * Called when Gardena client generates a log message
 * @param {string} data Log message as string
 */
let onLog = (data) => console.log(data)

/**
 * Called when a Gardena device updates a status
 * @param {string} message JSON as plain text.
 */
let onMessage = (message) => {
    let json = JSON.parse(message)
    console.log(JSON.stringify(json))
}

gardena.connect(options)
```