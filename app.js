var express = require('express');
var app = express();
var serv = require('http').Server(app);
/*
app.get('/', function(req, res){
	res.sendFile(__dirname + '/game/index.html');
}); */
app.all('*', function(req, res, next) {
     var origin = req.get('origin'); 
     res.header('Access-Control-Allow-Origin', origin);
     res.header("Access-Control-Allow-Headers", "X-Requested-With");
     res.header('Access-Control-Allow-Headers', 'Content-Type');
     next();
});
app.use('/games/gobang/game', express.static(__dirname + '/game'));
app.get("/lyrics/:artist/:song", function(req, res){
    var lyrics = require("./server/lyrics");
    lyrics.get(req.params.artist, req.params.song, function(result, success){
        if(success) res.end(JSON.stringify(result));
    });
});

app.get("/cover/:album", function(req, res){
    var cover = require("./server/cover");
    cover.get(req.params.album, function(result, success){                console.log("cover", result);
        if(success) res.end(JSON.stringify(result));
    });
});
serv.listen(2000);
																console.log('Server started');
var playState = {wait4player:0, join: 1,  start: 2, wait: 3, play: 4, win: 5, left: 6, oneMore: 7};
var socketList={};
var players={};

function Player(id){
	this.id = id; 
	this.name = '';
	this.color = '';
	this.opponentID=0;
        this.nodes;
}
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
	
	socket.id =  Math.random();
	socketList[socket.id]=socket;
														                 console.log('connection: player'+socket.id);
	var player = new Player(socket.id); 
	players[socket.id] = player;
	var oppoID = findOpponent(player.id); 
	
	if(!oppoID) {
		player.color = 'white'; 
		socket.emit('proceed', {id: socket.id, state: playState.wait4player});
	}else{
		player.color = 'black';
		socketList[oppoID].emit('proceed', {oppoID: socket.id, state: playState.start});
		socket.emit('proceed', {id: socket.id, oppoID:oppoID, state: playState.join});
		player.nodes = players[oppoID].nodes = createNodes();
	}
															
	socket.on('disconnect', function(){
		var oppID = players[socket.id].opponentID; 
		if(oppID){
			socketList[oppID].emit('proceed', {id: oppID, oppoID: socket.id, state: playState.left});
			players[oppID].opponentID = 0;
                        players[oppID].color = 'white';
		}
		
		delete players[socket.id];
		delete socketList[socket.id];                                    console.log('disconnection: player'+socket.id);
	});
	
	socket.on('update', function(data){
                if(socket.id!==data.id) console.log('problem with socket id on the update stage');
		var oppID = players[socket.id].opponentID; 
		if(oppID){
                    socketList[oppID].emit('proceed', {state: playState.play, oppoID: socket.id, r: data.r, c: data.c}); 
 
                    var nodes = players[socket.id].nodes;
                    var go = players[socket.id].color ==='white' ? 1 : 2;
                    nodes[data.c][data.r] = go; 
                    if(checkNodes(nodes, data.c, data.r, go)){
                       socket.emit('proceed', {state: playState.win, id: socket.id}); 
                       socketList[oppID].emit('proceed', {state: playState.win, id: socket.id});
                       resetNodes(nodes);
                    }else {
                        console.log('player '+socket.id+' '+data.c+'/'+data.r+ ' = '+go);
                    }
                }else console.log('Problem with Opponent ID');
	});
	socket.on('msg', function(data){                                    //console.log(socket.id+'/'+data);
		var oppID = players[socket.id].opponentID; 
		if(oppID){
			socketList[oppID].emit('remsg', (socket.id+'').slice(2,7)+': '+data); 
		}
	});
	
	socket.on('oneMore', function(data){
		var oppID = players[socket.id].opponentID; 
		if(oppID){
			socket.emit('proceed', {state: playState.oneMore, id: socket.id}); 
            socketList[oppID].emit('proceed', {state: playState.oneMore, id: socket.id});
		}
	});

});

function findOpponent(playerID){
	for(var i in players){
		var opponent = players[i];
		if(opponent.id!==playerID && opponent.opponentID ===0) {
			opponent.opponentID = playerID; 
			players[playerID].opponentID = opponent.id;
			return opponent.id; 
		}
	}
	return 0; 	
}

function createNodes(){
    var NROWS=15;
    var nodes = new Array(NROWS);
    for (var x = 0; x <NROWS; x++) {
        nodes[x] = new Array(NROWS);
        for (var y = 0; y < NROWS; y++) {
            nodes[x][y] = 0;
        }
    }
    return nodes;
}
function resetNodes(nodes){
    var NROWS=15;
    for (var x = 0; x <NROWS; x++) {
        nodes[x] = new Array(NROWS);
        for (var y = 0; y < NROWS; y++) {
            nodes[x][y] = 0;
        }
    }
}

function checkNodes(nodes, col, row, go) {
            var count1 = count2 = count3 = count4 =0;
            var NROWS = NCOLS = 15; 
            //check col
            for (var c = col; c >= 0; c--) {
                if (nodes[c][row] !== go) break;
                count1++;
            }
            for (var c = col + 1; c < NCOLS; c++) {
                if (nodes[c][row] !== go) break;
                count1++;
            }
            // check row
            for (var r = row; r >= 0; r--) {
                if (nodes[col][r] !== go ) break;
                count2++;
            }
            for (var r = row + 1; r < NROWS; r++) {
                if (nodes[col][r] !== go) break;
                count2++;
            }
            //
            for (var c = col, r = row; r >= 0; c--, r--) {
                if(c<0) break;
                if (nodes[c][r] !== go) break;
                count3++;
            }
            for (var c = col + 1, r = row + 1; r<NROWS; c++, r++) {
                if(c >=NCOLS) break;
                if (nodes[c][r] !== go) break;
                count3++;
            }
            //
            for (var c = col, r = row; r < NROWS; c--, r++) {
                if(c<0) break;
                if (nodes[c][r] !== go) break;
                count4++;
            }
            for (var c = col + 1, r = row - 1; r >= 0; c++, r--) {
                if(c>=NCOLS) break;
                if (nodes[c][r] !== go) break;
                count4++;
            }
 
            if (count1 >= 5 || count2 >= 5 || count3 >= 5 || count4 >= 5) return true; 
            else return false;
        }
        