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


let peerConnection = new RTCPeerConnection();
window.iceCandidates = [];
window.remoteStreams = [];
window.localStreams = [];

peerConnection.ontrack = handleRemoteTrackAdded;
peerConnection.onicecandidate = handleIceCandidate;


function handleRemoteTrackAdded(event) {
  for (var k in event.streams) {
    window.remoteStreams.push(event.streams[k]);
    video_remote.playsInline = true;
    video_remote.srcObject = event.streams[k];
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
  }
}


function acceptRemoteIceCandidates() {
  var icecandidates = JSON.parse(t_remote_icecandidates.value);
  for (var k in icecandidates) {
    acceptRemoteIceCandidateSingle(icecandidates[k])
  }
}

function acceptRemoteIceCandidateSingle(candidate) {
  return peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  .then((res) => {
    console.log(res);
    console.log("success accept remote ice candidate");
    return true;
  })
  .catch((error) => {
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
  .then((stream) => {
    window.localStreams.push(stream);
    video_local.playsInline = true;
    video_local.srcObject = stream;
    video_local.play();
    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    t_local_streams.value = JSON.stringify(window.localStreams.map(function(it) {return {id: it.id};} ));
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
  })
}







function createOffer() {
  return peerConnection.createOffer({ 
    'offerToReceiveAudio': true, 
    'offerToReceiveVideo': true,
  })
  .then((offer) => {
    peerConnection.setLocalDescription(offer);
    t_local_offer.value = JSON.stringify(offer);
    return offer;
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
    throw e;
  })

}

function acceptOffer(offer) {
  if (offer) {
    console.log("acceptOffer", offer);
    t_remote_offer.value = JSON.stringify(offer);
  }
  offer = offer || JSON.parse(t_remote_offer.value);
  return peerConnection.setRemoteDescription(offer)
  .then(() => {
    console.log("acceptOffer OK!", peerConnection.remoteDescription);
    // alert("acceptOffer OK! " + JSON.stringify(peerConnection.remoteDescription.toJSON()));
    return true;
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
    throw e;
  })
}

function createAnswer() {

  // for (var k in window.localStreams) {
  //   var tracks = window.localStreams[k].getTracks();
  //   for (var m in tracks) {
  //     peerConnection.addTrack(tracks[m], window.localStreams[k]);
  //     console.log("SSpp")
  //   }
  // }

  // console.log("SS")

  return peerConnection.createAnswer({ 
    'offerToReceiveAudio': true, 
    'offerToReceiveVideo': true,
  })
  .then((answer) => {
    // console.log("SS22a")
    peerConnection.setLocalDescription(answer);
    t_local_answer.value = JSON.stringify(answer);
    return answer;
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
    throw e;
  })

}

function acceptAnswer(answer) {
  if (answer) {
    console.log("acceptAnswer", answer);
    t_remote_answer.value = JSON.stringify(answer);
  }
  answer = answer || JSON.parse(t_remote_answer.value);
  peerConnection.setRemoteDescription(answer)
  .then(() => {
    console.log("acceptAnswer OK!", peerConnection.remoteDescription);
    console.log("acceptAnswer OK! " + JSON.stringify(peerConnection.remoteDescription.toJSON()));
    return true;
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
    throw e;
  })
}



function macro_join() {
  if (!t_join_client_id.value.trim()) {
    console.log("Please enter client id");
    return;
  }

  if (window.ws_socket)
  {
    window.ws_socket.close();
  }

  const socket = new WebSocket('wss://ap4.www.vanportdev.com/_apps/_webrtc_signaling_server/');
  window.ws_socket = socket;

  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
    // You can send data to the server after the connection is opened
  });

  // Message received event
  socket.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
    // Handle the received message data

    const toClientId = t_join_client_id.value;


    var data = JSON.parse(event.data);
    if (data.type === 'hello') {
      console.log(data);
      t_host_client_id.value = data.clientId;

      createOffer()
      .then((payload) => {
        socket.send(JSON.stringify({
          "type": "offer",
          "payload": payload,
          "to": toClientId,
        }));
      })
    }

    else if (data.type === 'answer') {
      acceptAnswer(data.payload);
    }

    else if (data.type === 'ice-candidate') {

      acceptRemoteIceCandidateSingle(data.payload);

    }

  });

  // Connection closed event
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
  });


}

function macro_host() {

  if (window.ws_socket)
  {
    window.ws_socket.close();
  }

  const socket = new WebSocket('wss://ap4.www.vanportdev.com/_apps/_webrtc_signaling_server/');
  window.ws_socket = socket;

  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
  });

  // Message received event
  socket.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
    var data = JSON.parse(event.data);
    
    if (data.type === 'hello') {

      t_host_client_id.value = data.clientId;

    } else if (data.type === 'offer') {
      
      t_join_client_id.value = data.clientId;
      const toClientId = t_join_client_id.value;

      acceptOffer(data.payload)
      .then((res) => {
        if (res) {
          createAnswer()
          .then((payload) => {
            socket.send(JSON.stringify({
              "type": "answer",
              "payload": payload,
              "to": toClientId,
            }));
          })
        }
      })
    } else if (data.type === 'ice-candidate') {

      acceptRemoteIceCandidateSingle(data.payload);

    }
    // Handle the received message data
  });

  // Connection closed event
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
  });

}





function macro_join() {
  if (!t_join_client_id.value.trim()) {
    console.log("Please enter client id");
    return;
  }

  if (window.ws_socket)
  {
    window.ws_socket.close();
  }

  const socket = new WebSocket('wss://ap4.www.vanportdev.com/_apps/_webrtc_signaling_server/');
  window.ws_socket = socket;

  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
    // You can send data to the server after the connection is opened
  });

  // Message received event
  socket.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
    // Handle the received message data

    const toClientId = t_join_client_id.value;


    var data = JSON.parse(event.data);
    if (data.type === 'hello') {
      console.log(data);
      t_host_client_id.value = data.clientId;

      createOffer()
      .then((payload) => {
        socket.send(JSON.stringify({
          "type": "offer",
          "payload": payload,
          "to": toClientId,
        }));
      })
    }

    else if (data.type === 'answer') {
      acceptAnswer(data.payload);
    }

    else if (data.type === 'ice-candidate') {

      acceptRemoteIceCandidateSingle(data.payload);

    }

  });

  // Connection closed event
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
  });


}

function macro_host() {

  if (window.ws_socket)
  {
    window.ws_socket.close();
  }

  const socket = new WebSocket('wss://ap4.www.vanportdev.com/_apps/_webrtc_signaling_server/');
  window.ws_socket = socket;

  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened');
  });

  // Message received event
  socket.addEventListener('message', (event) => {
    console.log('Received message:', event.data);
    var data = JSON.parse(event.data);
    
    if (data.type === 'hello') {

      t_host_client_id.value = data.clientId;

    } else if (data.type === 'offer') {
      
      t_join_client_id.value = data.clientId;
      const toClientId = t_join_client_id.value;

      acceptOffer(data.payload)
      .then((res) => {
        if (res) {
          createAnswer()
          .then((payload) => {
            socket.send(JSON.stringify({
              "type": "answer",
              "payload": payload,
              "to": toClientId,
            }));
          })
        }
      })
    } else if (data.type === 'ice-candidate') {

      acceptRemoteIceCandidateSingle(data.payload);

    }
    // Handle the received message data
  });

  // Connection closed event
  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed');
  });

}
