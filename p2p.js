var connection = {};
var local;
var yourVideo = document.getElementById("yours");

function setLocal(user){
	local = user;
}

function peerConnection(data){
	var theirVideo;
	var theirVideoId;
	var configuration = {
			"iceServers": [{ "url": "stun:stun.1.google.com:19302"
			}]
	};
	var remote;
	var p2pConnection;
}

function initConnection(peer){
	connection[peer] = new peerConnection(peer);
	connection[peer].createVideo(peer, function(){
		connection[peer].startConnection(peer, function(){
			connection[peer].makeOffer( function(offer){
				console.log("send offer to " + peer);
				console.log(offer);
				socket.emit("SDPOffer", {
					type: "SDPOffer",
					local: local,
					remote: peer,
					offer: offer
				});
			})
		})
	})
}

function buildEnvironment(data, cb){
	console.log(data);
	connection[data] = new peerConnection(data);
	connection[data].createVideo(data, function(){
		connection[data].startConnection(data, function(){
			cb();
		});
	});
}

function onOffer(data){
	console.log(data.remote);
	connection[data.remote].receiveOffer(data, function(answer){
		socket.emit("SDPAnswer", {
			type: "SDPAnswer",
			local: local,
			remote: data.remote,
			answer: answer
		});
		console.log(connection[data.remote].p2pConnection.localDescription);
		console.log(connection[data.remote].p2pConnection.remoteDescription);
	}) 
}

function onAnswer(data){
	connection[data.remote].receiveAnswer(data);
}

function onCandidate(data){
	connection[data.remote].addCandidate(data);
}

function hasUserMedia() {
	navigator.getUserMedia = navigator.getUserMedia ||
	navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
	navigator.msGetUserMedia;
	return !!navigator.getUserMedia;
}

function hasRTCPeerConnection() {
	window.RTCPeerConnection = window.RTCPeerConnection ||
	window.webkitRTCPeerConnection || window.mozRTCPeerConnection
	window.RTCSessionDescription = window.RTCSessionDescription
	window.webkitRTCSessionDescription ||
	window.mozRTCSessionDescription;
	window.RTCIceCandidate = window.RTCIceCandidate ||
	window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
	return !!window.RTCPeerConnection;
}

peerConnection.prototype.createVideo = function(peer, cb){
	this.remote = peer;
	var remotes = document.getElementById("remoteVideoContainer");
	if (remotes) {
		var remoteVideo = document.createElement("video");
		remoteVideo.className = "remoteVideo";
		remoteVideo.id = "theirConnection" + peer;
		this.theirVideoId = remoteVideo.id;
		remoteVideo.autoPlay = true;
		remotes.appendChild(remoteVideo);
		this.theirVideo = document.getElementById(this.theirVideoId);
	}
	cb();
}

peerConnection.prototype.setupPeerConnection = function(peer, stream) {
	var self = this;
	// Setup stream listening
	this.p2pConnection.addStream(stream);
	this.p2pConnection.onaddstream = function (e) {
		self.theirVideo.src = window.URL.createObjectURL(e.stream);
	};

	// Setup ice handling
	this.p2pConnection.onicecandidate = function (event) {
		if (event.candidate) {
			socket.emit("candidate", {
				type: "candidate",
				local: local,
				remote: peer,
				candidate: event.candidate
			});
		}
	};
}

peerConnection.prototype.startConnection = function(peer, cb){
	var self = this;
	this.p2pConnection = new webkitRTCPeerConnection(this.configuration);
	console.log(this.p2pConnection);
	if (hasUserMedia()) {
		navigator.getUserMedia({ video: true, audio: false }, function (stream) {
			yourVideo.src = window.URL.createObjectURL(stream);
			if (hasRTCPeerConnection()) {
				self.setupPeerConnection(peer, stream);
				cb();
			} else {
				alert("Sorry, your browser does not support WebRTC.");
			}
		}, function (error) {
			console.log(error);
		});
	} else {
		alert("Sorry, your browser does not support WebRTC.");
	}
}

peerConnection.prototype.makeOffer = function(cb)	{
	var self = this;
	this.p2pConnection.createOffer(function (offer) {
		self.p2pConnection.setLocalDescription(offer);
		cb(offer);
	}, function(error){
		console.log(error);
	});
}

peerConnection.prototype.receiveOffer = function(data, cb){
	var self = this;
	var SDPOffer = new RTCSessionDescription(data.offer);
	this.p2pConnection.setRemoteDescription(SDPOffer, function(){
		self.p2pConnection.createAnswer(function (answer) {
			self.p2pConnection.setLocalDescription(answer);
			cb(answer);
		},function(error){
			console.log(error);
		});
	});
}

peerConnection.prototype.receiveAnswer = function(data){
	var SDPAnswer = new RTCSessionDescription(data.answer);
	if (SDPAnswer == null){
		alert("data is empty");
	}else {
		console.log(SDPAnswer);
	}
	this.p2pConnection.setRemoteDescription(SDPAnswer);
	console.log(this.p2pConnection.localDescription);
	console.log(this.p2pConnection.remoteDescription);
}

peerConnection.prototype.addCandidate = function(data) {
	this.p2pConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}
