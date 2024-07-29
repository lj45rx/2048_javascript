//-----------------------------------------------------------------------------
// copied from cars example
//-----------------------------------------------------------------------------
function lerp(A,B,t){
	// t between 0 and 1
	// "how far between A and B"
	return A+(B-A)*t;
}

function getIntersection(A,B,C,D){
	const tTop = (D.x-C.x)*(A.y-C.y)-(D.y-C.y)*(A.x-C.x);
	const uTop = (C.y-A.y)*(A.x-B.x)-(C.x-A.x)*(A.y-B.y);
	const bottom = (D.y-C.y)*(B.x-A.x)-(D.x-C.x)*(B.y-A.y);
	
	if(bottom!=0){
		const t = tTop/bottom;
		const u = uTop/bottom;
		if(t>=0 && t<=1 && u>=0 && u<=1){
			return {
				x: lerp(A.x, B.x, t),
				y: lerp(A.y, B.y, t),
				offset: t
			}
		}
	}
}

// check all lines for intersections 
function polysIntersect(poly1, poly2){
	for(let i = 0; i < poly1.length; i++){
		for(let j = 0; j < poly2.length; j++){
			const touch = getIntersection(
				poly1[i],
				poly1[(i+1)%poly1.length], // is 0 in last step
				poly2[j],
				poly2[(j+1)%poly2.length]
			);
			if(touch){
				return true;
			}
		}
	}
	return false;
}

function getRGBA(value){
	const alpha = Math.abs(value);
	// yellow for positive connections R=G
	// blue for negative
	const R = value<0?0:255;
	const G = R;
	const B = value>0?0:255;
	return `rgba(${R},${G},${B},${alpha})`; 
}

//-----------------------------------------------------------------------------
// arrays 
//-----------------------------------------------------------------------------
function splitSizeIntoGroups(size, noGroups){
	let sizePerGroup = Math.floor(size/noGroups);
	let rest = size%noGroups;

	let groupSizes = Array();
	for(let i = 0; i < noGroups; i++){
		if( i < rest ){
			groupSizes.push(sizePerGroup+1);
		} else {
			groupSizes.push(sizePerGroup);
		}
	}

	return groupSizes;
}

//-----------------------------------------------------------------------------
// randomizations etc 
//-----------------------------------------------------------------------------
//https://bost.ocks.org/mike/shuffle/
/**
 * in-place shuffle array contents
 * @param {Array} array 
 */
function shuffleArray(array) {
	var m = array.length, t, i;
  
	// While there remain elements to shuffle…
	while (m) {
  
	  // Pick a remaining element…
	  i = Math.floor(Math.random() * m--);
  
	  // And swap it with the current element.
	  t = array[m];
	  array[m] = array[i];
	  array[i] = t;
	}
  }

/**
 * @param {number} max 
 * @returns random int from range [0, max]
 */
function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

//-----------------------------------------------------------------------------
// working with angles
//-----------------------------------------------------------------------------
/**
 * 
 * @param {number} angle
 * @returns corresponding angle in degrees [0,359] where up is 0
 */
function projectDegreesTo_0_359(angle){
	// place into [0,359]
	// eg (720 -> 0), (-10 -> 350), (-450 -> 270)
	return (360+(angle%360))%360;
}



/**
 * find the smallest difference between 2 angles
 * @param {number} first angle in degrees
 * @param {number} second angle in degrees
 * @param {number} maxDifference maximum degress result may have
 * @param {boolean} print show output in log 
 * @returns minimal distance in degress, negative if counterclockwise
 */
function findDifferenceBetweenAngles(first,second,maxDifference=360, log=false){
	first = projectDegreesTo_0_359(first);
	second = projectDegreesTo_0_359(second);
	maxDifference = Math.abs(maxDifference);

	let clockwiseDist = 		(360 + (second - first))%360;
	let counterClockwiseDist =	(360 - (second - first))%360;
	let moveClockwise = clockwiseDist <= counterClockwiseDist;
	
	let distance, nextAngle, turnDist;
	if(moveClockwise){
		turnDist = Math.min(maxDifference, clockwiseDist);
		nextAngle = first + turnDist;
		distance = turnDist;
	} else {
		turnDist = Math.min(maxDifference, counterClockwiseDist);
		nextAngle = first - turnDist;
		distance = -1*turnDist;
	}
	nextAngle += 360;
	nextAngle %= 360;
	
	if(log){
		let dirStr = moveClockwise? "right" : "left";
		console.log(first, "->", second, " maxDiff(", maxDifference, ")");
		console.log("turn", turnDist, dirStr, "to", nextAngle, "distance", distance);
	}

	return distance;
}

function test_findDifferenceBetweenAngles(testCount=500, print=false){
	for(let i = 0; i < testCount; i++){
		// alternate clockwise/counterclockwise
		let testClockwise = i%2 == 0;

		let distance, limitedDistance;
		if(testClockwise){
			distance = Math.floor(Math.random() * 180);
			limitedDistance = Math.floor(Math.random() * Math.abs(distance) );
		} else {
			distance = -1 * Math.floor(Math.random() * 179);
			limitedDistance = -1 * Math.floor(Math.random() * Math.abs(distance) );
		}

		let firstAngle = Math.floor(Math.random() * 360); // randInt [0,360]
		let secondAngle = (firstAngle+distance+360)%360;

		
		let result = findDifferenceBetweenAngles(firstAngle, secondAngle);
		let resultLimited = findDifferenceBetweenAngles(firstAngle, secondAngle, Math.abs(limitedDistance));

		if(print){
			console.log("----------------------------------------")
			console.log(firstAngle, secondAngle, limitedDistance)
			console.log(distance, result)
			console.log(limitedDistance, resultLimited)
		}

		if( result != distance ){
			console.log("error for", firstAngle, "->", secondAngle);
			console.log(">> expected", distance, "got", result);
			return false;
		}
		if( resultLimited != limitedDistance ){
			console.log("error for", firstAngle, "->", secondAngle, "limited to ", Math.abs(limitedDistance));
			console.log(">> expected", limitedDistance, "got", resultLimited);
			return false;
		}
	}

	console.log("all seems good, ran", testCount, "tests")
	return true;
}

function angle(ax, ay, bx, by, print=false) {
	var dy = by - ay;
	var dx = bx - ax;
	var theta = Math.atan2(dy, dx); // range (-PI, PI]
	theta *= 180 / Math.PI; 		// rads to degs, range (-180, 180]
	if (theta < 0){
		theta = 360 + theta; 		// range [0, 360)
	}

	//TODO why does 0 often point right?
	// make 0 point up
	theta = (theta+90)%360;
	
	if(print){
		let first = {x:ax, y:ay};
		let second = {x:bx, y:by};
		console.log("angle between ", first, "and", second, theta);
	}

	return theta;
}

function degreeToRadian(deg){
	deg = (deg-90)%360;
	return (deg*Math.PI)/180;
}



function degree360To180SignedZeroRight(degree){
	let shifted = degree-90;

	if(180 < shifted ){
		return shifted-360;
	}
	return shifted;
}

function degree360To180SignedZeroUp(degree){
	if(180 < degree ){
		return degree-360;
	}
	return degree;
}

function distance(a,b){
	return Math.sqrt( 
		Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2)
	)
}


//-----------------------------------------------------------------------------
// draw on canvas
//-----------------------------------------------------------------------------

function findMaxFontSizeFromWidth(ctx, width, text="999"){
	//assume maximum 3digit number - maximum font fitting in width
	
	let i = 1;
	for(; i <= 24; i++){
		//console.log("font", i, ctx.measureText("999").width, "vs", width)
		ctx.font = i+"px Arial";
		
		if( width <= ctx.measureText(text).width+2){
			break;
		}
	}
	
	return i+"px Arial";
}

function drawTextInRect(ctx,x,y,w,h,text,font,fill=false, color="black",fillColor="#000000"){
	ctx.lineWidth = 4;
	ctx.strokeStyle = "#000000";
	if(fill){
		ctx.fillStyle = fillColor;
		ctx.fillRect(x,y,w,h);
	}
	ctx.font = font;
	//ctx.font="8px Georgia";
	ctx.textAlign="center"; 
	ctx.textBaseline = "middle";
	ctx.fillStyle = color;
	
	ctx.fillText(text,x+(w/2),y+(h/2));
}







