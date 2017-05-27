/***************** re-edited 03/09/2017 copyright @ richyan.com ***************/

var canvas = $('#canvas');
var conSub = $('.conSubTitle');
var CL = canvas.offset().left, CT = canvas.offset().top, CW = 544;   // canvas width;
var ctx = document.getElementById('canvas').getContext('2d');

var img_b = new Image();
img_b.src = "images/b.png";
var img_w = new Image();
img_w.src = "images/w.png";

var NROWS =15, NCOLS = 15, squareW = CW/(NCOLS+1);    
var canPlay = false; var nodes = createNodes();
var playState = {wait4player:0, join: 1, start: 2, wait: 3, play: 4, win: 5,  left: 6, oneMore:7}; // wait state is not used
var me = {id: 0, oppoID: 0, color: '', name: ''};      // function Player(){this.id=playerID;this.oppoID=oppoID;this.color=isWhite;}
var socket = io();
socket.on('proceed', function(data){
    switch (data.state){
        case playState.wait4player: 
            me.id = data.id;
            me.color = 'white';
            $('.playerID').html('ID: '+ shortid(me.id));
            $('.color').attr('src', 'images/w.png');
            conSub.html('You hold white GO, waiting for another player ...');                   console.log(me);
            break;
        case playState.join:
            conSub.html('You hold Black Go, player white GO move first');
            me.id = data.id;
            me.oppoID = data.oppoID; 
            me.color='black';                                                                   console.log(me);				
            $('.playerID').html('ID: '+ shortid(me.id));
            $('.color').attr('src', 'images/b.png');
            break;
        case playState.start: 
            me.oppoID = data.oppoID;
            conSub.html('Player'+ shortid(me.oppoID) +' connected. you move first');            console.log(me);
            canPlay = true; 
            break;
        
        case playState.win:
           
            if(me.id===data.id){
                window.alert('You win !!!');
                //conSub.html('You win !!!');
            }else if(me.oppoID ===data.id) {
                window.alert('YOu Lost !!! Player'+ shortid(me.oppoID) +' win !!!');
            }else conSub.html('System Erro !!! ');
            conSub.html('<a href="javascript: replay();" style="background-color: #f0f0f0; padding: 2px;">One More Game</a>');
            canPlay = false;
            nodes = createNodes();
            break;
         
        case playState.play:
            if(me.oppoID !== data.oppoID) console.log("playstate problem with play + oppoID wrong!!!");
            canPlay = true; 
            var img = me.color==='white' ? img_b : img_w; 
            drawGo(img, data.c, data.r);                       //draw opponent GO
            conSub.html('Player'+ shortid(me.oppoID) +' finished move. Your turn...');
            break;
            
        case playState.left:
            //window.alert('player'+oppoID+' left, wait for another player');
            conSub.html('player'+ shortid(me.oppoID) +' left, wait for another player');
            me.oppoID = 0; 
            me.color = 'white'; 
            $('.color').attr('src', 'images/w.png');
            canPlay = false;
            ctx.clearRect(0,0,CW,CW);
            drawSquare();
            nodes = createNodes();
            break;
	case playState.oneMore:
            if(me.color==='white') conSub.html('One more game, you move first');
            else conSub.html('One more game, white GO move first');
            canPlay = true; 
            ctx.clearRect(0,0,CW,CW);
            drawSquare();
            break;
    }
    
});
socket.on('remsg',function(data){                           console.log(data);
	$('div.chatCont').append('<div>'+data+'</div>');
});
function replay(){
	socket.emit('oneMore', {});
}
canvas.click(function(e){
    if(!canPlay) return;                                                                              //console.log(e.pageX+'/'+e.pageY);
    var startX = CL+squareW/2, startY = CT +squareW/2;
    var row =  parseInt((e.pageY-startY)/squareW);
    var col = parseInt((e.pageX-startX)/squareW);  
    if(row===NROWS || col===NCOLS) return;                                  console.log(col +'/'+row);
    if(nodes[col][row]){
        window.alert("Can't place Go here - " +col+'/'+row);
        return;
    }
    var img = me.color==='white'? img_w: img_b;
    drawGo(img, col, row);

    canPlay = false;
    conSub.html('You ve finished move. Wait...');
    socket.emit('update', {id: me.id, c: col, r: row});
});
function shortid(id){
    id=id+'';
    return id.slice(2,7);
}
function drawGo(img, col, row){
    ctx.drawImage(img, col*squareW+squareW/2, row*squareW+squareW/2 );
    nodes[col][row]=1;
}


function drawSquare(){
    for (var i = 0; i <=CW; i += squareW) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(CW, i);
                ctx.closePath();
                ctx.stroke();
 
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, CW);
                ctx.closePath();
                ctx.stroke();
    }
}
$('#chat').on('keyup', function(e){
	if(e.keyCode===13){
            var msg = $(this).val().trim();
            if(msg ==='') return; 
            $('div.chatCont').append('<div>You: '+msg+'</div>');
            $('div.chatCont').animate({'scrollTop': $('div.chatCont')[0].scrollHeight}, 'slow');
            if(me.oppoID) socket.emit('msg', msg);
            $(this).val('');
	}
});

function createNodes(){
    var nodes = new Array(NROWS);
    for (var x = 0; x <NROWS; x++) {
        nodes[x] = new Array(NCOLS);
        for (var y = 0; y < NCOLS; y++) {
            nodes[x][y] = 0;
        }
    }
    return nodes;
}
window.addEventListener("scroll", setPos, false);
window.addEventListener("resize", setPos, false);
function setPos(){
    CL = canvas.offset().left;
    CT = canvas.offset().top;
}
