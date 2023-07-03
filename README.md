# webrtc_pure_html_breakdown

I am trying to make the use of WebRTC really really simple to understand.

```
# Flow of a typical RTCPeerConnection usage
Step 1: offerer create offer, setlocaldescription from offer
Step 2: answerer setremotedescription from offer
Step 3: answerer create answer, setlocaldescription from answer
Step 4: offerer setremotedescription from answerer
Step 5: both handle ice candidate, share ice candidates to opponents
Step 6: opponents exchange ice candidates and calls addIceCandidate with the ice candidates from each other
```

## Prerequisites

```
# Assume you have node installed:
npm install -g pm2
npm install -g http-server
```

## Server

1. Open "server" folder
2. ```npm install```
3. ```node server.js``` or  ```./deployforever.sh```

## Client

1. Open "client" folder
2. ```http-server```
3. Open ```http://localhost:8080/test4.html``` with Chrome for best results


