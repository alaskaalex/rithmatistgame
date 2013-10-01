function Circle(path, center, r){
	this.path = path;
	this.coords = path.coords;
	this.position = path.position;
	
	this.evaluate = evaluate;
	this.draw = draw;
	this.update = update;
	
	if (center !== undefined && center.x && center.y && r){
		this.r = r;
		this.center = center;
	} else {
		this.r = 0;
		this.center = new coord(0,0);
		this.evaluate();
	}
	
	function evaluate (){
		debug ("evaluating circle... ");
		var thirdLen = Math.floor((this.coords.length/3) - 1);
		var circlemeta;
		var rand;
		var samples = 5;
		var Xs = 0, Ys = 0, Xo = 0, Yo = 0, r = 0;
		
		//sample a bunch of times, then average
		for (var j = 0; j < samples; j++){
			P=[];
			rand = Math.floor((Math.random()*thirdLen)+1); 
			for (var x = rand; x < this.coords.length; x+=thirdLen){
				P.push(this.coords[x]);
			}
			var m11, m12, m13, m14;
			var a = [[0,0,0],[0,0,0],[0,0,0]];

			for (var i = 0; i < 3; i++)                    // find minor 11
			{
				a[i][0] = P[i].x;
				a[i][1] = P[i].y;
				a[i][2] = 1;
			}
			m11 = determinant( a, 3 );

			for (var i = 0; i < 3; i++)                    // find minor 12 
			{
				a[i][0] = P[i].x*P[i].x + P[i].y*P[i].y;
				a[i][1] = P[i].y;
				a[i][2] = 1;
			}
			m12 = determinant( a, 3 );

			for (var i = 0; i < 3; i++)                    // find minor 13
			{
				a[i][0] = P[i].x*P[i].x + P[i].y*P[i].y;
				a[i][1] = P[i].x;
				a[i][2] = 1;
			}
			m13 = determinant( a, 3 );

			for (var i = 0; i < 3; i++)                    // find minor 14
			{
				a[i][0] = P[i].x*P[i].x + P[i].y*P[i].y;
				a[i][1] = P[i].x;
				a[i][2] = P[i].y;
			}
			m14 = determinant( a, 3 );


			if (m11 == 0)
			{
				r = 0;                                 // not a circle
			}
			else
			{
				Xo =  0.5 * m12 / m11;                 // center of circle
				Yo = -0.5 * m13 / m11;
				r  += Math.sqrt( Xo*Xo + Yo*Yo + m14/m11 );
				Xs += Xo;
				Ys += Yo;
			}
		}
		
		this.r = r / samples;
		this.center.x = Xs / samples;
		this.center.y = Ys / samples;
		
			
		var circlefail = 0;
		var maximumfail = 0;
		for (var x = 0; x < this.coords.length; x++){
			fail = Math.abs(distanceCoords(this.center, this.coords[x]) - this.r);
			circlefail += fail;
			fail = Math.floor(fail);
			maximumfail = Math.max(maximumfail, fail);
			debug(fail + ", " + maximumfail);
		}
		circlefail /= this.coords.length;
		circlefail *= 10;
		circlefail = Math.max(Math.floor(100 - circlefail), 0);
		this.integrity = circlefail;
		
		if (this.integrity != 0 && maximumfail > 0){
			for (var x = 0; x < this.coords.length; x++){
				fail = Math.abs(distanceCoords(this.center, this.coords[x]) - this.r);
				this.coords[x].health = Math.max(100 - (100 * (fail/maximumfail)), this.integrity);
				debug(this.coords[x].health)
			}
		}
		
		return this.integrity;
	}
	
	function update() {
	
	}
	
	function draw(){
		this.path.draw();
    	if (debugOn && this.center.x != 0){
    		c.beginPath();
    		c.arc(this.center.x, this.center.y, 1, 0, 2 * Math.PI, true);
    		c.fill();
    		context.strokeStyle = "blue";
 			context.lineWidth = 1;
    		c.beginPath();
    		c.arc(this.center.x, this.center.y, this.r, 0, 2 * Math.PI, true);
    		c.stroke();
    	}
	}
}


// Recursive definition of determinate using expansion by minors.
function determinant( a, n )
{
	var i, j, j1, j2;
	var d = parseFloat("0");
	var m = [[0,0,0],[0,0,0],[0,0,0]];

	if (n == 2)                                // terminate recursion
	{
		d = a[0][0]*a[1][1] - a[1][0]*a[0][1];
	}
	else 
	{
		d = 0;
		for (j1 = 0; j1 < n; j1++ )            // do each column
		{
			for (i = 1; i < n; i++)            // create minor
			{
				j2 = 0;
				for (j = 0; j < n; j++)
				{
					if (j == j1) continue;
					m[i-1][j2] = a[i][j];
					j2++;
				}
			}
		
			// sum (+/-)cofactor * minor  
			d = d + Math.pow(-1.0, j1)*a[0][j1]*determinant( m, n-1 );
		}
	}

	return d;
}

function Line(path, slope, vertical, integrity){
	this.path = path;
	this.coords = path.coords;
	this.position = path.position;
	this.slope = 0;
	this.vertical = false;
	this.start = this.coords[0];
	this.end = this.coords[this.coords.length - 1];
	
	this.evaluate = evaluate;
	this.draw = draw;
	this.update = update;
	
	if (this.slope !== undefined && this.integrity !== undefined){
		this.slope = slope;
		this.vertical = vertical;
		this.integrity = integrity;
	} else {
		this.integrity = 0;
		this.evaluate();
	}

	function evaluate () {
		this.slope = (this.end.y - this.start.y)/(this.end.x - this.start.x);
		debug(this.slope);
		if (Math.abs(this.slope) > 3){
			this.slope = (this.end.x - this.start.x)/(this.end.y - this.start.y);
			this.vertical = true;
		}
		
		var linefail = 0;
		var maxfail = 0;
		var co;
		for (var x = 0; x < this.coords.length; x++){
			co = this.coords[x];
			dX = co.x - this.start.x;
			dY = co.y - this.start.y;
			if (this.vertical){
				eX = dY * this.slope;
				fail = Math.abs(eX - dX);
			} else {
				eY = dX * this.slope;
				fail = Math.abs(eY - dY);
			}
			linefail += fail;
			maxfail = Math.max(maxfail, fail);
		}
		linefail /= this.coords.length;
		this.integrity = Math.floor(Math.max(100 - (linefail / 10) * 100, 0));
		
		
		if (this.integrity != 0 && maxfail > 0){
			for (var x = 0; x < this.coords.length; x++){
				co = this.coords[x];
				dX = co.x - this.start.x;
				dY = co.y - this.start.y;
				if (this.vertical){
					eX = dY * this.slope;
					fail = Math.abs(eX - dX);
				} else {
					eY = dX * this.slope;
					fail = Math.abs(eY - dY);
				}
				this.coords[x].health = Math.max(100 - (100 * (fail/maxfail)), this.integrity);
			}	
		}
		
		debug(this.integrity);
		
		return this.integrity;
	}
	
	function update () {
	
	}
	
	function draw (){
		path.draw();
		if (debugOn){
			c.beginPath();
			c.moveTo(this.start.x, this.start.y);
			c.lineTo(this.end.x, this.end.y);
			context.strokeStyle = "blue";
			context.lineWidth = 1;
			c.stroke();
		}
	}
}

function Sine(path, slope, vertical, integrity){
	this.path = path;
	this.coords = path.coords;
	this.position = path.position;
	
	this.rotatedPath = new Path();
	
	this.speed = 5;
	
	this.slope = 0;
	this.angle = 0;
	this.vertical = false;
	this.startsNegative = false;
	this.periods = 0;
	this.periodLength = 0;
	this.amplitude = 0;
	this.start = this.coords[0];
	this.end = this.coords[this.coords.length - 1];
	
	this.evaluate = evaluate;
	this.draw = draw;
	this.update = update;
	
	if (this.slope !== undefined && this.integrity !== undefined){
		this.slope = slope;
		this.vertical = vertical;
		this.integrity = integrity;
	} else {
		this.integrity = 0;
		this.evaluate();
	}

	function evaluate () {
		this.slope = (this.end.y - this.start.y)/(this.end.x - this.start.x);
		debug("slope: " + this.slope);
		/*if (Math.abs(this.slope) > 3){
			this.slope = (this.end.x - this.start.x)/(this.end.y - this.start.y);
			this.vertical = true;
		}*/
		
		this.integrity = 100;
		
		
		this.angle = -Math.atan(this.slope);
		/*if (this.vertical){
			this.angle += Math.PI/2;
		}*/
		
		
		var co;
		var rX;
		var rY;
		var amps = 0;
		var maxima = 0;
		var lastrY;
		var halfperiods = 0;
		var reachedMaxima = false;
		for (var x = 0; x < this.coords.length; x++){
			co = this.coords[x];
			rX = (co.x - this.start.x) * Math.cos(this.angle) - (co.y - this.start.y) * Math.sin(this.angle);
			rY = (co.x - this.start.x) * Math.sin(this.angle) + (co.y - this.start.y) * Math.cos(this.angle);
			//debug("(" + Math.floor(rX) + ", " + Math.floor(rY) + ")");
			
			//this.rotatedPath.pushCoord(new coord(rX + this.start.x, rY + this.start.y));
			
			if (x + 1 < this.coords.length){
				nrY = (this.coords[x+1].x - this.start.x) * Math.sin(this.angle) + (this.coords[x+1].y - this.start.y) * Math.cos(this.angle);
			}
		
			if (Math.abs(rY) > Math.abs(nrY) && Math.abs(rY) > Math.abs(lastrY)){
				if (maxima == 0 && rY > 0){
					this.startsNegative = true;
				}
				debug(Math.floor(lastrY) + ", " + Math.floor(rY) + ", " + Math.floor(nrY));
				amps += Math.abs(rY);
				maxima ++;
				reachedMaxima = true;
			}

			if ( ( lastrY > 0 && rY < 0 ) || ( lastrY < 0 && rY > 0 ) && reachedMaxima ) {
				halfperiods++;
				reachedMaxima = false;
			}
			lastrY = rY;
		}
		
		this.amplitude = (amps / maxima);
		debug ("amplitude: "  + this.amplitude);
		this.periods = (halfperiods+1)/2;
		this.periodLength = distanceCoords(this.start, this.end)/this.periods;
		debug ("periods: " + this.periods);
		debug("periodlength: " + this.periodLength);
		
		if (this.periods < 2){
			this.integrity = 0;
			return;
		}
		
		var fail = 0;
		var linefail = 0;
		for (var x = 0; x < this.coords.length; x++){
			co = this.coords[x];
			rX = (co.x - this.start.x) * Math.cos(this.angle) - (co.y - this.start.y) * Math.sin(this.angle);
			rY = (co.x - this.start.x) * Math.sin(this.angle) + (co.y - this.start.y) * Math.cos(this.angle);
			//debug("(" + Math.floor(rX) + ", " + Math.floor(rY) + ")");
			
			eY = this.amplitude * Math.sin(((2 * Math.PI)/ this.periodLength) * rX);
			if (!this.startsNegative) {
				eY *= -1;
			}
			
			fail = Math.abs(Math.abs(eY) - Math.abs(rY));
			linefail +=  fail;
			if (fail > this.amplitude * 2){
				debug ('more fail than amp * 2');
				this.integrity = 0;
				return;
			}
		}
		linefail /= this.coords.length;
		linefail /= 25;
		linefail *= 100;
		this.integrity = Math.max(100 - linefail, 0);
		
		for (var x = 0; x < this.coords.length; x++){
			co = this.coords[x];
			co.health = this.integrity;
		}
		
		debug(this.integrity);
	}
	
	function update () {
		var velocity = 10;
		if (this.slope > 0){
			velocity *= -1;
		} if (this.start.y > this.end.y){
			velocity *= -1;
		}
		var nX = velocity * Math.cos(-this.angle);
		var nY = velocity * Math.sin(-this.angle);
		this.position.x += nX;
		this.position.y += nY;
	}
	
	function draw (){
		this.path.draw();
		
		
		this.rotatedPath.draw();
		if (debugOn){			
			c.save();
			context.lineWidth = 1;
			context.strokeStyle = "blue";
			c.beginPath();
			
			c.moveTo(this.start.x, this.start.y);
			c.lineTo(this.end.x, this.end.y);
			c.stroke();

			/*
			
			Yo, you need to accommodate for sine waves that start on the negative in drawing
			also evaluate sine waves for accuracy
			
			also if people don't start & end sine drawings at 0
			
			*/

			
			c.translate(this.start.x,this.start.y);
			c.rotate(Math.atan(this.slope));
			
			var periods = this.periods;
			var period = this.periodLength;
			
			//var periods=2, period=160, 
			var interval=period/2, amplitude=this.amplitude, S, C1, C2, E, i, amplitude43 = amplitude * 4/3;
	
			context.beginPath();
			for(i=0; i<(2*periods); i+=2) {
				// first segment
				S = {x:i*interval, y:0};
				C1 = {x:i*interval+amplitude43/2, y:amplitude43};
				C2 = {x:(i+1)*interval-amplitude43/2, y:amplitude43};
				E = {x:(i+1)*interval, y:0};
				context.moveTo(S.x, S.y);
				if (this.startsNegative) {
					C1.y *= -1;
					C2.y *= -1;
				}
				context.bezierCurveTo(C1.x, -C1.y, C2.x, -C2.y, E.x, E.y);
				// second segment
				C1 = {x:(i+1)*interval+amplitude43/2, y:-amplitude43};
				C2 = {x:(i+2)*interval-amplitude43/2, y:-amplitude43};
				E = {x:(i+2)*interval, y:0};
				if (this.startsNegative) {
					C1.y *= -1;
					C2.y *= -1;
				}
				context.bezierCurveTo(C1.x, -C1.y, C2.x, -C2.y, E.x, E.y);
			}
			c.stroke();
			
			c.restore();
		
		}
	}
}

