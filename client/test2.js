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
  alert("handleRemoteTrackAdded")

  t_remote_streams.value = JSON.stringify(window.remoteStreams.map(function(it) {return {id: it.id};} ));
}

function handleIceCandidate(event) {
  if (event.candidate) {
    window.iceCandidates.push(event.candidate);
    console.log("handleIceCandidate", event.candidate, window.iceCandidates);
    alert("handleIceCandidate")
    t_local_icecandidates.value = JSON.stringify(iceCandidates);
  }
}


function acceptRemoteIceCandidates() {
  var icecandidates = JSON.parse(t_remote_icecandidates.value);
  for (var k in icecandidates) {
    peerConnection.addIceCandidate(new RTCIceCandidate(icecandidates[k]))
    .then((res) => {
      console.log(res);
      alert("success accept remote ice candidate");
    })
    .catch((error) => {
      console.error('Error adding remote ICE candidate:', error);
      alert('Error adding remote ICE candidate:' + error.message);
    });
}
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
      window.localStreams.push(stream);
    });

    t_local_streams.value = JSON.stringify(window.localStreams.map(function(it) {return {id: it.id};} ));
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
  })
}







function createOffer() {
  peerConnection.createOffer()
  .then((offer) => {
    peerConnection.setLocalDescription(offer);
    t_local_offer.value = JSON.stringify(offer);
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
  })

}

function acceptOffer() {
  var offer = JSON.parse(t_remote_offer.value);
  peerConnection.setRemoteDescription(offer)
  .then(() => {
    console.log("acceptOffer OK!", peerConnection.remoteDescription);
    alert("acceptOffer OK! " + JSON.stringify(peerConnection.remoteDescription.toJSON()));
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
  })
}

function createAnswer() {
  peerConnection.createAnswer()
  .then((answer) => {
    peerConnection.setLocalDescription(answer);
    t_local_answer.value = JSON.stringify(answer);
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
  })

}

function acceptAnswer() {
  var answer = JSON.parse(t_remote_answer.value);
  peerConnection.setRemoteDescription(answer)
  .then(() => {
    console.log("acceptAnswer OK!", peerConnection.remoteDescription);
    alert("acceptAnswer OK! " + JSON.stringify(peerConnection.remoteDescription.toJSON()));
  })
  .catch((e) => {
    console.error(e);
    alert(e.message);
  })
}


