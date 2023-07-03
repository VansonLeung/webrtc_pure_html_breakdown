const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream, remoteStream;
let localPeerConnection, remotePeerConnection;
let isLocalVideoEnabled = true;
let isLocalAudioEnabled = false;

function startVideoChat() {
  const constraints = {
    video: isLocalVideoEnabled,
    audio: isLocalAudioEnabled
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = localStream;

      localPeerConnection = new RTCPeerConnection();

      localStream.getTracks().forEach((track) => {
        localPeerConnection.addTrack(track, localStream);
      });

      console.log("1 createOffer")
      return localPeerConnection.createOffer();
    })
    .then((offer) => {
      console.log("2 createOffer", offer, JSON.stringify(offer))
      console.log("3 setLocalDescription", offer, JSON.stringify(offer))
      return localPeerConnection.setLocalDescription(offer);
    })
    .then(() => {
      remotePeerConnection = new RTCPeerConnection();

      remotePeerConnection.ontrack = handleRemoteTrackAdded;
      remotePeerConnection.onicecandidate = handleRemoteICECandidate;

      console.log("4 setRemoteDescription", localPeerConnection.localDescription)
      return remotePeerConnection.setRemoteDescription(localPeerConnection.localDescription);
    })
    .then(() => {
      console.log("5 setRemoteDescription")
      console.log("6 createAnswer")
      return remotePeerConnection.createAnswer();
    })
    .then((answer) => {
      console.log("7 createAnswer", answer)
      console.log("8 setLocalDescription", answer)
      return remotePeerConnection.setLocalDescription(answer);
    })
    .then(() => {
      console.log("9 setLocalDescription")
      return localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription);
    })
    .catch((error) => {
      console.error('Error starting video chat:', error);
    });
}


function setRemoteDescription()
{
  
}



function toggleLocalVideo() {
  isLocalVideoEnabled = !isLocalVideoEnabled;
  localStream.getVideoTracks().forEach((track) => {
    track.enabled = isLocalVideoEnabled;
  });
  localVideo.srcObject = isLocalVideoEnabled ? localStream : null;
}

function toggleLocalAudio() {
  isLocalAudioEnabled = !isLocalAudioEnabled;
  localStream.getAudioTracks().forEach((track) => {
    track.enabled = isLocalAudioEnabled;
  });
}

function handleRemoteTrackAdded(event) {
  remoteStream = event.streams[0];
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteICECandidate(event) {
  if (event.candidate) {
    localPeerConnection.addIceCandidate(event.candidate)
      .catch((error) => {
        console.error('Error adding remote ICE candidate:', error);
      });
  }
}