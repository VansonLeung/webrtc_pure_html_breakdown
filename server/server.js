
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const os = require('os');

const rawClientIdMapping = {};
const rawClientToRemoteIPMapping = {};
const rawClientToLocalIPMapping = {};
const rawClientToClientIdMapping = {};
const clientIdToRawClientIdMapping = {};

function makeid(length) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}




function getNetworkIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interfaceData = interfaces[interfaceName];
    for (const data of interfaceData) {
      if (data.family === 'IPv4' && !data.internal) {
        return data.address;
      }
    }
  }
};




wss.on('connection', (socket, req) => {

  const rawClientId = makeid(32);

  rawClientIdMapping[rawClientId] = socket;
  rawClientToRemoteIPMapping[rawClientId] = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  rawClientToLocalIPMapping[rawClientId] = req.socket.localAddress;

  console.log(new Date(), 'Websocket connection opened', req.socket.remoteAddress, req.socket.localAddress );
  
  socket.send(JSON.stringify({
    type: "hello-stranger",
    remoteIP: rawClientToRemoteIPMapping[rawClientId],
    localIP: rawClientToLocalIPMapping[rawClientId],
    networkIP: getNetworkIpAddress(),
  }));


  socket.on('message', (message) => {
    // Handle incoming signaling messages here
    const data = JSON.parse(message);
    const { type, payload, to } = data;

    switch (type) {
      case 'set-client-id':

        var final_clientId = "";

        console.log(new Date(), 'Received set-client-id:', payload);

        if (payload.useServerNetworkIP) {
          final_clientId = getNetworkIpAddress();
        }
        else if (payload.useClientRemoteIP) {
          final_clientId = rawClientToRemoteIPMapping[rawClientId];
        }
        else if (payload.useClientLocalIP) {
          final_clientId = rawClientToLocalIPMapping[rawClientId];
        }
        else if (payload.clientId) {
          final_clientId = payload.clientId;
        }
        else {
          final_clientId = makeid(8);
        }

        if (final_clientId) {
          clientIdToRawClientIdMapping[final_clientId] = rawClientId;
          rawClientToClientIdMapping[rawClientId] = final_clientId;
        }

        socket.send(JSON.stringify({
          type: "hello",
          clientId: final_clientId,
        }));

        console.log(final_clientId, Object.keys(rawClientIdMapping), Object.keys(rawClientToClientIdMapping), rawClientId, final_clientId);

        break;

      case 'offer':
        // Handle offer data
        console.log(new Date(), 'Received offer:', payload);
        if (to && clientIdToRawClientIdMapping[to] && rawClientIdMapping[clientIdToRawClientIdMapping[to]]) {
          rawClientIdMapping[clientIdToRawClientIdMapping[to]].send(JSON.stringify({
            clientId: rawClientToClientIdMapping[rawClientId],
            type: type,
            payload: payload,
          }));
        }
        // Process the offer and send appropriate responses
        break;

      case 'request-offer':        
        console.log(new Date(), 'Received request for an offer:', payload);
        if (to && clientIdToRawClientIdMapping[to] && rawClientIdMapping[clientIdToRawClientIdMapping[to]]) {
          rawClientIdMapping[clientIdToRawClientIdMapping[to]].send(JSON.stringify({
            clientId: rawClientToClientIdMapping[rawClientId],
            type: type,
            payload: payload,
          }));
        } else {
          rawClientIdMapping[rawClientId].send(JSON.stringify({
            clientId: to,
            type: 'client-id-not-found',
          }));
        }
        // Process the offer and send appropriate responses
        break;


      case 'request-devices':        
        console.log(new Date(), 'Received request for an devices:', payload);
        if (to && clientIdToRawClientIdMapping[to] && rawClientIdMapping[clientIdToRawClientIdMapping[to]]) {
          rawClientIdMapping[clientIdToRawClientIdMapping[to]].send(JSON.stringify({
            clientId: rawClientToClientIdMapping[rawClientId],
            type: type,
            payload: payload,
          }));
        }
        // Process the devices and send appropriate responses
        break;


      case 'list-devices':        
        console.log(new Date(), 'Received list for an devices:', payload);
        if (to && clientIdToRawClientIdMapping[to] && rawClientIdMapping[clientIdToRawClientIdMapping[to]]) {
          rawClientIdMapping[clientIdToRawClientIdMapping[to]].send(JSON.stringify({
            clientId: rawClientToClientIdMapping[rawClientId],
            type: type,
            payload: payload,
          }));
        }
        // Process the devices and send appropriate responses
        break;

      case 'answer':
        // Handle answer data
        console.log(new Date(), 'Received answer:', payload);
        if (to && clientIdToRawClientIdMapping[to] && rawClientIdMapping[clientIdToRawClientIdMapping[to]]) {
          rawClientIdMapping[clientIdToRawClientIdMapping[to]].send(JSON.stringify({
            clientId: rawClientToClientIdMapping[rawClientId],
            type: type,
            payload: payload,
          }));
        }
        // Process the answer and send appropriate responses
        break;

      case 'ice-candidate':
        // Handle ICE candidate data
        console.log(new Date(), 'Received ICE candidate:', payload);
        if (to && clientIdToRawClientIdMapping[to] && rawClientIdMapping[clientIdToRawClientIdMapping[to]]) {
          rawClientIdMapping[clientIdToRawClientIdMapping[to]].send(JSON.stringify({
            clientId: rawClientToClientIdMapping[rawClientId],
            type: type,
            payload: payload,
          }));
        }
        // Process the ICE candidate and send appropriate responses
        break;

      default:
        // Handle other signaling message types, if any
        break;
    }
  });


  socket.on('close', () => {
    // Handle Socket.IO connection close event here
    console.log(new Date(), 'Websocket connection closed', rawClientToRemoteIPMapping[rawClientId], rawClientToLocalIPMapping[rawClientId], rawClientToClientIdMapping[rawClientId], rawClientId );
    if (rawClientToClientIdMapping[rawClientId]) {
      delete clientIdToRawClientIdMapping[rawClientToClientIdMapping[rawClientId]];
    }
    delete rawClientToClientIdMapping[rawClientId];
    delete rawClientToRemoteIPMapping[rawClientId];
    delete rawClientToLocalIPMapping[rawClientId];
    delete rawClientIdMapping[rawClientId];
  });
});


const PORT = 8987; // You can change the port number to your desired value
server.listen(PORT, () => {
  console.log(new Date(), `Server is listening on port ${PORT}`);
});


