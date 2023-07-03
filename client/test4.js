const video_local = document.getElementById('video_local');
const video_remote = document.getElementById('video_remote');
const t_local_offer = document.getElementById('t_local_offer');
const t_remote_offer = document.getElementById('t_remote_offer');
const t_local_answer = document.getElementById('t_local_answer');
const t_remote_answer = document.getElementById('t_remote_answer');
const t_local_icecandidates = document.getElementById('t_local_icecandidates');
const t_remote_icecandidates = document.getElementById('t_remote_icecandidates');
const t_local_streams = document.getElementById('t_local_streams');
const t_remote_streams = document.getElementById('t_remote_streams');
const t_local_devices = document.getElementById('t_local_devices');
const t_remote_devices = document.getElementById('t_remote_devices');
const t_join_client_id = document.getElementById('t_join_client_id');
const t_host_client_id = document.getElementById('t_host_client_id');

window.video_local = video_local;
window.video_remote = video_remote;
window.t_local_offer = t_local_offer;
window.t_remote_offer = t_remote_offer;
window.t_local_answer = t_local_answer;
window.t_remote_answer = t_remote_answer;
window.t_local_icecandidates = t_local_icecandidates;
window.t_remote_icecandidates = t_remote_icecandidates;
window.t_local_streams = t_local_streams;
window.t_remote_streams = t_remote_streams;
window.t_local_devices = t_local_devices;
window.t_remote_devices = t_remote_devices;


window.peerConnections = {};
window.iceCandidates = [];
window.remoteStreams = [];
window.localVideoDevices = {};
window.localAudioDevices = {};
window.clientIdNotFound = false;


function handleRemoteTrackAdded(event) {
  for (var k in event.streams) {
    window.remoteStreams.push(event.streams[k]);
    video_remote.playsInline = true;
    video_remote.srcObject = event.streams[k];
    video_remote.muted = true;
    video_remote.play();
  }
  console.log("handleRemoteTrackAdded", event.streams, window.remoteStreams);
  console.log("handleRemoteTrackAdded")

  t_remote_streams.value = JSON.stringify(window.remoteStreams.map(function(it) {return {id: it.id};} ));
}

function handleIceCandidate(event) {
  if (event.candidate) {
    window.iceCandidates.push(event.candidate);
    console.log("handleIceCandidate", event.candidate, window.iceCandidates);
    console.log("handleIceCandidate")
    t_local_icecandidates.value = JSON.stringify(iceCandidates);

    // acceptRemoteIceCandidateSingle(event.candidate);

    if (window.ws_socket) {
      window.ws_socket.send(JSON.stringify({
        to: t_join_client_id.value,
        payload: event.candidate,
        type: 'ice-candidate',
      }));
    }
  } else {
    console.log('Did someone disconnect?', event);
  }
}


function acceptRemoteIceCandidates() {
  var icecandidates = JSON.parse(t_remote_icecandidates.value);
  for (var k in icecandidates) {
    acceptRemoteIceCandidateSingle(icecandidates[k])
  }
}

function acceptRemoteIceCandidateSingle(peerConnection, candidate) {
  return peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  .then(function(res) {
    console.log(res);
    console.log("success accept remote ice candidate");
    return true;
  })
  .catch(function(error) {
    console.error('Error adding remote ICE candidate:', error);
    alert('Error adding remote ICE candidate:' + error.message);
    throw error;
  });
}



function startSharingInput(video, audio) {
  const constraints = {
    video: video,
    audio: audio,
  };

  navigator.mediaDevices.getUserMedia(constraints)
  .then(function(stream) {
    console.log("Get stream", stream);

    return navigator.mediaDevices.enumerateDevices()
  })
  .then(function(devices) {
    console.log("Get devices", devices);

    for (var k in devices) {
      let device = devices[k];
      if (device.kind === "audioinput") {
        window.localAudioDevices[device.label] = device;
      } else if (device.kind === "videoinput") {
        window.localVideoDevices[device.label] = device;
      }
    }

    var strs = "";
    for (var k in window.localVideoDevices) {
      strs += window.localVideoDevices[k].label + "\n";
    }

    window.t_local_devices.value = strs + "\n\n" + JSON.stringify({
      videos: window.localVideoDevices,
      audios: window.localAudioDevices,
    });

  })
  .catch(function(e) {
    console.error(e);
    alert(e.message);
  })


}






function connectWebsocketSignalingServer(url, is_use_remote_ip, client_id, join_id) {
  return new Promise(function (resolve, reject) {
    const socket = new WebSocket(url);
    window.ws_socket = socket;
  
    socket.addEventListener('open', function(event) {
      console.log('WebSocket connection opened');
    });
  
    socket.addEventListener('message', function(event) {
      console.log('Received message:', event.data);
      var data = JSON.parse(event.data);

      if (data.type === 'hello-stranger') {
        console.log(data);

        
        if (!join_id) {

          if (is_use_remote_ip) {

            socket.send(JSON.stringify({
              "type": "set-client-id",
              "payload": {
                clientId: data.remoteIP+"_"+client_id,
                // useClientRemoteIP: true,
              },
            }));
  
          } else {

            socket.send(JSON.stringify({
              "type": "set-client-id",
              "payload": {
                clientId: client_id,
                // useClientRemoteIP: true,
              },
            }));
  
          }

        } else {

          if (client_id) {
            socket.send(JSON.stringify({
              "type": "set-client-id",
              "payload": {
                clientId: client_id,
                // useClientRemoteIP: true,
              },
            }));
          } else {
            socket.send(JSON.stringify({
              "type": "set-client-id",
              "payload": {
              },
            }));
          }

        }
      }

      else if (data.type === 'hello') {
        console.log(data);
        t_host_client_id.value = data.clientId;

        resolve({
          clientId: t_host_client_id,
        });
      }
    });  

    socket.addEventListener('close', function(event) {
      console.log('WebSocket connection closed');
    });  
    
  });
}






function createOffer(peerConnection, offerRequest) {
  
  return new Promise(function(resolve, reject) {
    if (offerRequest.video_id) {
      if (window.localVideoDevices[offerRequest.video_id]) {
        navigator.mediaDevices.getUserMedia({
          video: { deviceId: window.localVideoDevices[offerRequest.video_id].deviceId, },
          audio: false,
        })
        .then(function(stream) {
          resolve(stream);
        })
        .catch(function(e) {
          reject(e);
        });
      }

      return;
    }
    
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
    .then(function(stream) {
      resolve(stream);
    })
    .catch(function(e) {
      reject(e);
    })
  })
  .then(function(stream) {
    console.log("Get actual stream", stream);
    let tracks = stream.getTracks();
    for (var k in tracks) {
      let track = tracks[k];
      peerConnection.addTrack(track, stream);
      // video_local.playsInline = true;
      // video_local.srcObject = stream;
      // video_local.play();
      return peerConnection.createOffer()
    }
  })
  .then(function(offer) {
    peerConnection.setLocalDescription(offer);
    t_local_offer.value = JSON.stringify(offer);
    return offer;
  })
  .catch(function(e) {
    console.error(e);
    alert(e.message);
    throw e;
  })
}

function acceptOffer(peerConnection, offer) {
  if (offer) {
    console.log("acceptOffer", offer);
    t_remote_offer.value = JSON.stringify(offer);
  }
  offer = offer || JSON.parse(t_remote_offer.value);
  return peerConnection.setRemoteDescription(offer)
  .then(function() {
    console.log("acceptOffer OK!", peerConnection.remoteDescription);
    // alert("acceptOffer OK! " + JSON.stringify(peerConnection.remoteDescription.toJSON()));
    return true;
  })
  .catch(function(e) {
    console.error(e);
    alert(e.message);
    throw e;
  })
}

function createAnswer(peerConnection) {
  return peerConnection.createAnswer()
  .then(function(answer) {
    // console.log("SS22a")
    peerConnection.setLocalDescription(answer);
    t_local_answer.value = JSON.stringify(answer);
    return answer;
  })
  .catch(function(e) {
    console.error(e);
    alert(e.message);
    throw e;
  })

}

function acceptAnswer(peerConnection, answer) {
  if (answer) {
    console.log("acceptAnswer", answer);
    t_remote_answer.value = JSON.stringify(answer);
  }
  answer = answer || JSON.parse(t_remote_answer.value);
  peerConnection.setRemoteDescription(answer)
  .then(function() {
    console.log("acceptAnswer OK!", peerConnection.remoteDescription);
    console.log("acceptAnswer OK! " + JSON.stringify(peerConnection.remoteDescription.toJSON()));
    return true;
  })
  .catch(function(e) {
    console.error(e);
    alert(e.message);
    throw e;
  })
}





function macro_full(is_request_offer, video_id) {
  const socket = window.ws_socket;

  // Message received event
  socket.addEventListener('message', function(event) {
    // Handle the received message data

    var data = JSON.parse(event.data);
    console.log('Received message:', data);
    
    if (data.type === 'offer') {
      
      t_join_client_id.value = data.clientId;
      const toClientId = t_join_client_id.value;

      let peerConnection = new RTCPeerConnection();
      window.peerConnections[toClientId] = peerConnection;
      peerConnection.ontrack = handleRemoteTrackAdded;
      peerConnection.onicecandidate = handleIceCandidate;

      acceptOffer(window.peerConnections[toClientId], data.payload)
      .then(function(res) {
        if (res) {
          createAnswer(window.peerConnections[toClientId])
          .then(function(payload) {
            socket.send(JSON.stringify({
              "type": "answer",
              "payload": payload,
              "to": toClientId,
            }));
          })
        }
      })
    }


    else if (data.type === 'request-offer') {
      
      t_join_client_id.value = data.clientId;
      const toClientId = t_join_client_id.value;

      let peerConnection = new RTCPeerConnection();
      window.peerConnections[toClientId] = peerConnection;
      peerConnection.ontrack = handleRemoteTrackAdded;
      peerConnection.onicecandidate = handleIceCandidate;

      
      createOffer(window.peerConnections[toClientId], data.payload)
      .then(function(payload) {
        socket.send(JSON.stringify({
          "type": "offer",
          "payload": payload,
          "to": toClientId,
        }));
      })
    }
    
    else if (data.type === 'answer') {
      const toClientId = data.clientId;
      acceptAnswer(window.peerConnections[toClientId], data.payload);
    }

    else if (data.type === 'ice-candidate') {
      const toClientId = data.clientId;
      acceptRemoteIceCandidateSingle(window.peerConnections[toClientId], data.payload);
    }

    else if (data.type === 'request-devices') {
      const toClientId = data.clientId;
      socket.send(JSON.stringify({
        "type": "list-devices",
        "payload": {
          videos: window.localVideoDevices,
          audios: window.localAudioDevices,
        },
        "to": toClientId,
      }));
    }
  
    else if (data.type === 'list-devices') {
      var strs = "";
      for (var k in data.payload.videos) {
        strs += data.payload.videos[k].label + "\n";
      }
      window.t_remote_devices.value = strs + "\n\n" + JSON.stringify(data.payload);
    }

    else if (data.type === 'client-id-not-found') {
      window.clientIdNotFound = true;
    }
  
  });


  if (is_request_offer) {
    const toClientId = t_join_client_id.value;
    console.log("is_request_offer", toClientId);

    const payload = {};
    if (video_id) {
      payload.video_id = video_id;
    }

    socket.send(JSON.stringify({
      "type": "request-devices",
      "payload": payload,
      "to": toClientId,
    }));

    socket.send(JSON.stringify({
      "type": "request-offer",
      "payload": payload,
      "to": toClientId,
    }));
  }

}
