// target frames per second
const FPS = 30;
var playerSpeed = 60;
var canvasSpeed = 30;
var bulletSpeed = 200;
var x = 0;
var y = 0;
var time = 0;
var aspectRatio = 1;
var scale = 1;
var nominalWidth = 256;
var nominalHeight = nominalWidth / aspectRatio;
var image = new Image();
image.src = "gears.png";
var canvas = null;
var context2D = null;
var player = null;
var bullets = [];


function getWindowSize() {
    var myWidth = 0, myHeight = 0;
    if( typeof( window.innerWidth ) == 'number' ) {
	//Non-IE
	myWidth = window.innerWidth;
	myHeight = window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
	//IE 6+ in 'standards compliant mode'
	myWidth = document.documentElement.clientWidth;
	myHeight = document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
	//IE 4 compatible
	myWidth = document.body.clientWidth;
	myHeight = document.body.clientHeight;
    }
    return {width: myWidth - 5, height: myHeight - 5};
}

function resizeWindow() {
    var size = getWindowSize();
    //size.height = Math.min(nominalHeight, size.height);
    if (size.width / aspectRatio < size.height) {
	canvas.width = size.width;
	canvas.height = size.width / aspectRatio;
    }
    else {
	canvas.width = size.height * aspectRatio;
	canvas.height = size.height;
    }
    scale = canvas.width / nominalWidth;

    drawbuffer.width = nominalWidth;
    drawbuffer.height = nominalHeight;
}

function imageToBob(image) {
    context2D.drawImage(image, 0, 0);
    var imageData;
    try { 
	imageData = context2D.getImageData(0, 0, image.width, image.height);
    } catch (e) { 
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	imageData = context2D.getImageData(0, 0, image.width, image.height);
    } 						 
    var bob = new Array(image.width);
    for (var i = 0 ; i < image.width ; ++i) {
	bob[i] = new Array(image.height);
	for (var j = 0 ; j < image.height ; ++j) {
	    bob[i][j] = imageData.data[(i + j * image.width) * 4] *
		imageData.data[(i + j * image.width) * 4 + 3] / 128;
	}
    }
    return bob;
}

function initGame() {
    var now = new Date();
    startTime = now.getTime() / 1000;
    time = 0;
    bullets = dynamicArray();
    bullets.used = 0;
    circle = imageToBob(circleImage);
}

var imagesLoaded = 0;
var imagesToLoad;
function loadingDone() {
    imagesLoaded += 1;
    if (imagesLoaded == imagesToLoad) {
	initGame();
	setInterval(draw, 1000 / FPS);
	if(window.event) {
	    // IE
	    document.onkeydown = keydown_ie;
	    document.onkeyup = keyup_ie;
	}
	else {
	    // Netscape/Firefox/Opera
	    document.onkeydown = keydown;
	    document.onkeyup = keyup;
	}
    }
}

function loadImage(name) {
    var img = new Image();
    img.src = name;
    $(img).load(loadingDone);
    return img;
}

$(function() {
      canvas = document.getElementById('canvas');
      context2D = canvas.getContext('2d');

      drawbuffer = document.getElementById('drawbuffer');
      drawcontext = drawbuffer.getContext('2d');
      
      resizeWindow();
      
      shadebob = new Array(nominalWidth);
      for (var i = 0 ; i < nominalWidth ; ++i) {
	  shadebob[i] = new Array(nominalHeight);
	  for (var j = 0 ; j < nominalHeight ; ++j) {
	      shadebob[i][j] = 0;
	  }
      }

      palette = new Array(256);
      for (var i = 0 ; i < 64 ; ++i) {
	  palette[i] = new Array(4);
	  palette[i][0] = 0;
	  palette[i][1] = 255;
	  palette[i][2] = 255;
	  palette[i][3] = i * 4;
      }
      for (var i = 0 ; i < 64 ; ++i) {
	  palette[i + 64] = new Array(4);
	  palette[i + 64][0] = i * 4;
	  palette[i + 64][1] = 255 - i * 4;
	  palette[i + 64][2] = 255;
	  palette[i + 64][3] = 255;
      }
      for (var i = 0 ; i < 64 ; ++i) {
	  palette[i + 128] = new Array(4);
	  palette[i + 128][0] = 255;
	  palette[i + 128][1] = 0;
	  palette[i + 128][2] = 255;
	  palette[i + 128][3] = 255 - i * 4;
      }
      for (var i = 0 ; i < 64 ; ++i) {
	  palette[i + 192] = new Array(4);
	  palette[i + 192][0] = 0;
	  palette[i + 192][1] = 0;
	  palette[i + 192][2] = 255;
	  palette[i + 192][3] = i * 4;
      }

      imagesToLoad = 1;
      circleImage = loadImage("circle.png");
});
    
$(window).resize(resizeWindow);

var keys = [];
keys.down = false;
keys.up = false;
keys.left = false;
keys.right = false;
keys.shoot = false;
function keyCodeToName(code) {
    switch(code) {
    case 37: 
	return 'left';
    case 38:
	return 'up';
    case 39:
	return 'right';
    case 40:
	return 'down';
    case 90: // z
	return 'shoot'
    default:
	$("#debug").html(code);
    }
    return 'unknown';
}

function keydown(event) {
    var keynum = event.which;
    var name = keyCodeToName(keynum);
    keys[name] = true;
}
function keydown_ie(event) {
    var keynum = event.keyCode;
    var name = keyCodeToName(keynum);
    keys[name] = true;
}

function keyup(event) {
    var keynum = event.which;
    var name = keyCodeToName(keynum);
    keys[name] = false;
}
function keyup_ie(event) {
    var keynum = event.keyCode;
    var name = keyCodeToName(keynum);
    keys[name] = false;
}

function updateBullets(timeStep) {
    var i = 0;
    while (i < bullets.used) {
	bullets[i].move(timeStep);
	if (bullets[i].isDead()) {
	    delBullet(bullets, i);
	    continue;
	}
	i++;
    }
}

function drawBobImage(shadebob, image, startx, starty) {
    for (var x = 0 ; x < image.length ; ++x) {
	for (var y = 0 ; y < image[0].length ; ++y) {
	    var posx = Math.round(startx + x);
	    var posy = Math.round(starty + y);
	    if (posx >= 0 && posx < shadebob.length && posy >= 0 && posy < shadebob[0].length)
		shadebob[Math.round(startx + x)][Math.round(starty + y)] += image[x][y];
	}
    }
}

function drawBobToCanvas(shadebob, palette) {
    var img = drawcontext.createImageData(drawbuffer.width, drawbuffer.height);
    for (var x = 0 ; x < img.width ; ++x) {
	for (var y = 0 ; y < img.height ; ++y) {
	    var pos = (y * img.width + x) * 4;
	    var val = Math.round(shadebob[x][y]);
	    if (val < 0) val = 0;
	    if (val > 255) val = 255;
	    img.data[pos] = palette[val][0];
	    img.data[pos + 1] = palette[val][1];
	    img.data[pos + 2] = palette[val][2];
	    img.data[pos + 3] = palette[val][3];
	}
    }
    drawcontext.putImageData(img, 0, 0);
}

function reduceBob(shadebob, scale) {
    for (var x = 0 ; x < shadebob.length ; ++x) {
	for (var y = 0 ; y < shadebob[x].length ; ++y) {
	    shadebob[x][y] *= scale;
	}
    }    
}

function draw() {
    var now = new Date();
    timePrev = time;
    time = now.getTime() / 1000 - startTime;
    var timeStep = time - timePrev;

    updateBullets(timeStep);
    if (bullets.used == 0) {
	for (var alpha = 0 ;
             alpha < 2 * Math.PI + 0 ;
             alpha += Math.PI / (6 / 2)) {
            var cos = Math.cos(alpha);
            var sin = Math.sin(alpha);
	    var bend = Math.sin(time / 4.0) * 2;
	    var ccos = Math.cos(alpha + bend);
	    var csin = Math.sin(alpha + bend);
            addBullet(bullets, new Bullet(circleImage,
					  nominalWidth / 2 + cos * 40,
					  nominalHeight / 2 + sin * 40,
					  cos * bulletSpeed,
					  sin * bulletSpeed,
					  ccos * bulletSpeed * 2,
					  csin * bulletSpeed * 2));
	}
    }

    reduceBob(shadebob, .9);

    for (var i = 0 ; i < bullets.used ; ++i) {
	drawBobImage(shadebob, circle,
		     bullets[i].minX(),
		     bullets[i].minY());	
    }
    
    drawBobToCanvas(shadebob, palette);

    var radius = Math.sqrt(2) * Math.max(canvas.width, canvas.height) / 2;

    var gradient = context2D.createRadialGradient(
	canvas.width / 2, canvas.height / 2, 0,
	canvas.width / 2, canvas.height / 2, radius);
    gradient.addColorStop(0, "#EBB05D");
    gradient.addColorStop(1, "#FAFAB7");
    context2D.fillStyle = gradient;
    context2D.fillRect(0, 0, canvas.width, canvas.height);

    context2D.fillStyle = "#FCF79B";
    context2D.beginPath();
    for (var alpha = 0 ; alpha < Math.PI * 2.0 ; alpha += Math.PI / (16 / 2)) {
	context2D.moveTo(canvas.width / 2, canvas.height / 2);
	context2D.lineTo(canvas.width / 2 + Math.cos(alpha - 0.1) * radius,
			 canvas.height / 2 + Math.sin(alpha - 0.1) * radius);
	context2D.lineTo(canvas.width / 2 + Math.cos(alpha + 0.1) * radius,
			 canvas.height / 2 + Math.sin(alpha + 0.1) * radius);
	context2D.lineTo(canvas.width / 2, canvas.height / 2);
	context2D.closePath();
    }
    context2D.fill();

    context2D.drawImage(drawbuffer, 0, 0, drawbuffer.width, drawbuffer.height,
		       0, 0, canvas.width, canvas.height);
/*
    context2D.drawImage(circleImage,
			canvas.width / 2 + Math.sin(time) * canvas.width / 3,
			canvas.height / 2 + Math.sin(time) * canvas.height / 3);
*/
}
