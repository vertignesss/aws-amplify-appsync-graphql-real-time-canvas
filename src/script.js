
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);
var room=0;
var timeout;
let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

var pc_config = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
let localStream;
var pc=new RTCPeerConnection(pc_config);
let pc2;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

async function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    localStream = stream;
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
  sendMessage();
}
function processSignalingMessage(message) {
	var msg = JSON.parse(message);
	if (msg.type === 'offer') {
          if (!initiator && !started){
            	if (!started && localStream ) {
	           createPeerConnection();
	           pc.addStream(localStream);
	           started = true;
	           if (initiator)
                     pc.createOffer(setLocalAndSendMessage, null, {"optional": [], "mandatory": {"MozDontOfferDataChannel": true}});
                }
		pc.setRemoteDescription(new RTCSessionDescription(msg));
                pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
	} else if (msg.type === 'answer' && started) {
		pc.setRemoteDescription(new RTCSessionDescription(msg));
	} else if (msg.type === 'candidate' && started) {
		var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label, candidate:msg.candidate});
		pc.addIceCandidate(candidate);
	} else if (msg.type === 'bye' && started) {
                pc.close();
	}
}
}
function sendMessage(message) {
	var msgString = JSON.stringify(message);
	console.log('C->S: ' + msgString);
	$.ajax({
		type: "POST",	
                url: "/script.php",
		success: function b(data){
			console.log(['data.msg', data.msg])
			if( data.last) last = data.last;
			for (var res in data.msg){
				var msg = data.msg[res];
				processSignalingMessage(msg[2]);
			}
		}
	});
	is_new = 0;
	function repeat() {
		timeout = setTimeout(repeat, 5000);
		sendMessage();
	}
	if (!timeout) repeat();
}
pc.onicecandidate = onIceCandidate;
function onIceCandidate(event) {
	if (event.candidate) {
		sendMessage({type: 'candidate',                        
			label: event.candidate.sdpMLineIndex,                     
			id: event.candidate.sdpMid,                        
			candidate: event.candidate.candidate});
	} else {
		console.log("End of candidates.");
	}
}
pc.onaddstream = onRemoteStreamAdded;
function onRemoteStreamAdded(event) {
	remoteVideo.src = window.URL.createObjectURL(event.stream);
	remoteStream = event.stream;
}

setTimeout(start, 1);
function setLocalAndSendMessage(sessionDescription) {
	sessionDescription.sdp = preferOpus(sessionDescription.sdp);
	pc.setLocalDescription(sessionDescription);
	sendMessage(sessionDescription);
}
function call(){
	$.ajax({
		type:"GET",
		url:"/script.php",
		data:room,
		success: function a(data){
			room=data.room;
		}
	})
}
function hangup() {
  console.log('Ending call');
  pc.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}
