// noinspection JSUnresolvedVariable
import WebSocket from 'ws'
import fetch from 'node-fetch'

const one_second_in_milliseconds    = 1000
const one_minute_in_milliseconds    = 60 * one_second_in_milliseconds
const ten_minutes_in_milliseconds   = 10 * one_minute_in_milliseconds
const thirty_seconds_websocket_ping = 30 * one_second_in_milliseconds

let websocket_url       = undefined
let access_token        = undefined
let refresh_token       = undefined
let location_id         = undefined
let ping_interval_id    = undefined

let websocket
let username  = undefined
let password  = undefined
let apikey    = undefined
let log    = undefined
let callback  = undefined

let connect = (options) => {
    username = options.username
    password = options.password
    apikey = options.apikey
    log = (typeof options.log === 'function') ? options.log : () => { }
    callback = (typeof options.callback === 'function') ? options.callback : () => { }
    get_token_by_credentials()
}
let get_token_by_credentials = () => {
    let body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', apikey);
    body.set('username', username);
    body.set('password', password);
    log('fetching bearer and refresh token from auth provider signing-in with username and password')
    fetch('https://api.authentication.husqvarnagroup.dev/v1/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: body
    })
        .catch(err => {
            log('auth error: ' + err)
            log('retry using username and password')
            setTimeout(get_token_by_credentials, one_second_in_milliseconds)
        })
        .then(res => {
            if(res.ok) res.json()
                .then(json => {
                    access_token = json.access_token
                    refresh_token = json.refresh_token
                    setTimeout(get_token_by_refresh_token, json.expires_in * one_second_in_milliseconds - ten_minutes_in_milliseconds)
                    log('received new bearer and refresh token')
                    setTimeout(get_location_id, one_second_in_milliseconds)
                })
            else {
                log('auth response error: ' + res.statusText)
                log('retry using username and password')
                setTimeout(get_token_by_credentials, one_second_in_milliseconds)
            }
        })

}
let get_token_by_refresh_token = () => {
    let body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', apikey);
    body.set('refresh_token', refresh_token);
    log('updating bearer and refresh token signing-in with previous refresh token')
    fetch('https://api.authentication.husqvarnagroup.dev/v1/oauth2/token', {
        method: 'POST',
        body: body
    })
        .catch(err => {
            log('auth error: ' + err)
            log('will retry with username and password')
            setTimeout(get_token_by_credentials, one_second_in_milliseconds)
        })
        .then(res => {
            if(res.ok) {
                res.json()
                    .then(json => {
                        refresh_token = json.refresh_token
                        access_token = json.access_token
                        setTimeout(get_token_by_refresh_token, json.expires_in * one_second_in_milliseconds - ten_minutes_in_milliseconds)
                        log('received new bearer and refresh token')
                    })
            }
            else {
                log('auth error: ' + res.statusText)
                log('will retry with username and password')
                setTimeout(get_token_by_credentials, one_second_in_milliseconds)
            }
        })
}
let get_location_id = () => {
    log('fetching location id')
    fetch('https://api.smart.gardena.dev/v1/locations', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'X-Api-Key': apikey
        }
    })
        .catch(err => {
            log('location error: ' + err)
            log('retry fetching location id')
            setTimeout(get_location_id, one_second_in_milliseconds)
        })
        .then(res => {
            if(res.ok) {
                res.json()
                    .then(json => {
                        location_id = json.data[0].id
                        log('your location id: ' + location_id)
                        setTimeout(get_websocket_url, one_second_in_milliseconds)
                    })
            } else {
                log('location error: ' + res.statusText)
                log('retry fetching location id')
                setTimeout(get_location_id, one_second_in_milliseconds)
            }
        })
}
let get_websocket_url = () => {
    log('fetching custom websocket url for location: ' + location_id)
    fetch('https://api.smart.gardena.dev/v1/websocket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
            'X-Api-Key': apikey
        },
        body: JSON.stringify({
            'data': {
                'type': 'WEBSOCKET',
                'attributes': {
                    'locationId': location_id
                }
            }
        })
    })
        .catch(err => {
            log('websocket url query error: ' + err)
            log('retry fetching websocket url')
            setTimeout(get_websocket_url, one_second_in_milliseconds)
        })
        .then(res => {
            if(res.ok) {
                res.json()
                    .then(json => {
                        websocket_url = json.data.attributes.url
                        log(`new websocket url: ${websocket_url}`)
                        setTimeout(connect_websocket, one_second_in_milliseconds)
                    })
            } else {
                log('websocket url query error: ' + res.statusText)
                log('retry fetching websocket url')
                setTimeout(get_websocket_url, one_second_in_milliseconds)
            }
        })

}
let connect_websocket = () => {
    log(`connecting to gardena websocket on: ${websocket_url}`)
    websocket = new WebSocket(websocket_url)
    websocket.on('open', () => {
        log('connected to gardena websocket')
        ping_interval_id = setInterval(() => { websocket.ping() }, thirty_seconds_websocket_ping)
    })

    websocket.on('close', (data) => {
        log('connection to websocket closed: ' + data.reason)
        log('retry query location id')
        if(ping_interval_id !== undefined) clearInterval(ping_interval_id)
        setTimeout(get_location_id, one_second_in_milliseconds)
    })

    websocket.on('message', (data) => {
        log('websocket new message received: ' + data.toString())
        if(callback) callback(data.toString())
    })

    websocket.on('pong', () => {
        log(`keep alive - every ${thirty_seconds_websocket_ping / one_second_in_milliseconds}s`)
    })

    websocket.on('error', function message(data, error) {
        log('weboscket error: ' + error)
    })
}

export { connect }
