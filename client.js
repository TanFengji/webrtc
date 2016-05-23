var socket = io('http://localhost:8080');
var user;
var peerList = {};


function WebRTC(){
	var self = this;
	socket.on("createRoom", function(data){
		self.onCreateRoom(data);
	})

	socket.on("joinRoom", function(data){
		self.onJoinRoom(data);
	})
	
	socket.on("login", function(data) {
		if (data.status === "success"){
			user = data.userName;
			setLocal(user);
		} else if (data.status === "fail"){
			document.getElementById("feedback").value = "User " + data.userName + " already exists";
		}
		self.onLogin(data);
	})

}

WebRTC.prototype.onCreateRoom = function(data){};
WebRTC.prototype.onJoinRoom = function(data){};
WebRTC.prototype.onLogin = function(data){};

function send(e) {
	if (e.keyCode == 13) {
		var command = document.getElementById("command").value;
		if (command.length == 0)
			document.getElementById("feedback").value = "Input a valid command";
		else {
			socket.emit("login", command);
			document.getElementById("command").value = "";
		}
	}
}

function createRoom(e) {
	if (e.keyCode == 13) {
		var command = document.getElementById("createroom").value;
		if (command.length == 0)
			document.getElementById("feedback").value = "Input a valid command";
		else {
			socket.emit("createRoom", command);
			document.getElementById("createroom").value = "";
		}
	}
}

function joinRoom(e) {
	if (e.keyCode == 13) {
		var command = document.getElementById("joinroom").value;
		if (command.length == 0)
			document.getElementById("feedback").value = "Input a valid command";
		else {
			socket.emit("joinRoom", command);
			document.getElementById("joinroom").value = "";
		}
	}
}

socket.on("feedback", function(data) {
	document.getElementById("feedback").value = data;
})

socket.on("newUser", function(data) {
	console.log("newUser");
	console.log(data);
	buildEnvironment(data, function(){
		socket.emit("ICESetupStatus", {
			type: "ICESetupStatus",
			local: local,
			remote: data,
			ICESetupStatus: "DONE"
		});
		console.log("ICE setup Ready");
	});
})

socket.on("SDPOffer", function(data) {
	onOffer(data);
})

socket.on("SDPAnswer", function(data) {
	console.log("receive answer");
	onAnswer(data);
})

socket.on("peer", function(data) {
	peerList = {};
	for (var i in data.allUser){
		if (data.allUser[i] != user){
			peerList[data.allUser[i]] = data.allUser[i];
		}
	}
	document.getElementById("peer").value = peerList;
})

socket.on("candidate", function(data) {
	onCandidate(data);
})

socket.on("ICESetupStatus", function(data){
	console.log("start to connent to " + data.remote);
	initConnection(data.remote);
})



