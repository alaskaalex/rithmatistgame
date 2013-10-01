var browser_height;
var browser_width;
var gw;
var c;
var context;
var drawing;
var m_pos = {x:0, y:0};
var t_co = [];
var debugOn = !true;

var defaultColor = "black";
var defaultThickness = 3;

var drawable_stack = [];	

var current_path = new Path();

//returns the distance between coord a and b
function distanceCoords(a, b){
	return Math.sqrt( Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function debug(err){
	$('#debug').append(err + "<br />");
	$("#debug").scrollTop($("#debug")[0].scrollHeight);
}


function Path(coords){
	//this is a structure full of coordinates which make up the path
	if (coords !== undefined){
		this.coords = coords;
	} else {
		this.coords = [];
	}
	
	this.position = new coord(99999, 99999);
	this.startposition = new coord(99999, 99999);
	this.closed = false;
	
	//functions:
	this.pushCoord = pushCoord;
	this.draw = draw;
	this.update = update;
	
	function pushCoord (coord){
		if (coord.x !== undefined && coord.y !== undefined){
			this.coords.push(clone(coord));
			if (coord.x < this.position.x){
				this.position.x = coord.x;
				this.startposition.x = coord.x;
				debug (this.position.x);
			} if (coord.y < this.position.y){
				this.position.y = coord.y;
				this.startposition.y = coord.y;
				debug (this.position.y);
			}
			return true;
		}
		return false;
	}
	
	function update (){
	
	}

	function draw (){
	 	if (this.coords.length > 0){
	 		c.save();
	 		c.translate(this.position.x, this.position.y);
			c.moveTo(this.coords[0].x - this.startposition.x, this.coords[0].y - this.startposition.y);
			c.beginPath();
			var lastWidth = c.lineWidth;
			var p_co;
			for(var x = 0; this.coords.length > x; x++){
 				context.lineWidth = defaultThickness;
				p_co = clone(this.coords[x]);
				p_co.x -= this.startposition.x;
				p_co.y -= this.startposition.y;
				context.lineWidth = defaultThickness * (p_co.health / 100 );
				c.lineTo(p_co.x, p_co.y);
				if (c.lineWidth != lastWidth){
					c.stroke();
					c.beginPath();
					c.moveTo(p_co.x, p_co.y);
				}
				lastWidth = c.lineWidth;
			}
			if (this.closed){
				c.lineTo(this.coords[0].x - this.startposition.x, this.coords[0].y - this.startposition.y);
			}
			c.stroke();
			c.restore();
    	}
	}
}



function coord(x, y, health){
	this.x = x;
	this.y = y;
	this.health = health;
	this.add = add;
	
	function add(other){
		debug(this.x);
		this.x += other.x;
		this.y += other.y;
	}
}


function recalc_sizes(){
	browser_height = $(window).innerHeight();
	browser_width = $(window).innerWidth();
	gw.attr("width", browser_width);
	gw.attr("height", browser_height);
}

function clone(oldObject) {
   return jQuery.extend(true, {}, oldObject);
}

$(window).resize(function(){
	recalc_sizes();
});



$(document).ready(function(){
	gw=$('#gw');
	recalc_sizes();
	c = gw[0].getContext('2d');
	context = c;
	startloop();
	
	if (!debugOn){
		$('#debug').hide();
	}
	
	$('canvas').mousemove (function (e) {
		m_pos.x = e.pageX;
		m_pos.y = e.pageY;
		if (drawing){
			current_path.pushCoord(m_pos);
		}
	});

	$('canvas').mousedown( function (e) {
		drawing = true;
		m_pos.x = e.pageX;
		m_pos.y = e.pageY;
		current_path.pushCoord(m_pos);
		drawable_stack.push(current_path);
		debug(drawable_stack.length);
	});

	$('canvas').mouseup( function (e) { 
		drawing = false;
		current_path.pushCoord(m_pos);
		var drawable = evaluateShape(current_path);
		drawable_stack[drawable_stack.length - 1] = drawable;
		current_path = new Path();
	} );
	
});


var clearCanvas = function () {
	c.clearRect(0,0,browser_width, browser_height);
}

var updateGame = function() {
	for (var x = 0; x < drawable_stack.length; x++){
		drawable_stack[x].update();
	}
}

var drawGame = function() {
	clearCanvas();
    context.fillStyle = "blue";
    context.font = "bold 12px Arial";
    context.fillText("Zibri", 10, 10);
    context.strokeStyle = "#df4b26";
    context.fillStyle = "#df4b26";
  	context.lineJoin = "round";
 	context.lineWidth = defaultThickness;
 	
 	for (var x = 0; x < drawable_stack.length; x++){
 		drawable_stack[x].draw();
 	}
}


var mainloop = function() {
	updateGame();
	drawGame();
};

var startloop = function() {
	var animFrame = window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			null ;

	if ( animFrame !== null ) {
		var canvas = $('canvas').get(0);

		/*if ( $.browser.mozilla ) {
			var recursiveAnim = function() {
				mainloop();
				animFrame();
			};

			// setup for multiple calls
			window.addEventListener("MozBeforePaint", recursiveAnim, false);

			// start the mainloop
			animFrame();
		} else {*/
			var recursiveAnim = function() {
				mainloop();
				animFrame( recursiveAnim, canvas );
			};

			// start the mainloop
			animFrame( recursiveAnim, canvas );
		//}
	} else {
		var ONE_FRAME_TIME = 1000.0 / 60.0 ;
		setInterval( mainloop, ONE_FRAME_TIME );
	}
}




function evaluateShape(path){
	var coords = path.coords;

	//is closed shape?
	debug("dist:" + distanceCoords(coords[0], coords[coords.length - 1]));
	if(coords.length > 10 && distanceCoords(coords[0], coords[coords.length - 1]) < 20){
		path.closed = true;
	}
	
	//is circle?
	if (path.closed){
		circle = new Circle(path);
		if (circle.integrity == 0){
			debug("it's not a circle.");
			return path;
		} else {
			debug("circle of integrity " + circle.integrity)
			return circle;
		}
	} else {
		line = new Line(path);
		if (line.integrity == 0) {
			debug("it's not a line");
		} else {
			debug("line of integrity " + line.integrity);
			return line
		}
		sine = new Sine(path);
		if (sine.integrity == 0){
			debug("it's not a sine");
		} else {
			debug("sine of integrity: " + sine.integrity);
			return sine;
		}
	}
	
	return path;
}