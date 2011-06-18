// target frames per second
const FPS = 30;
var playerSpeed = 60;
var canvasSpeed = 30;
var bulletSpeed = 50;
var x = 0;
var y = 0;
var time = 0;
var aspectRatio = 1;
var scale = 1;
var nominalWidth = 512;
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
    size.height = Math.min(nominalHeight, size.height);
    if (size.width / aspectRatio < size.height) {
	canvas.width = size.width;
	canvas.height = size.width / aspectRatio;
    }
    else {
	canvas.width = size.height * aspectRatio;
	canvas.height = size.height;
    }
    scale = canvas.width / nominalWidth;
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
	    bob[i][j] = imageData.data[(i + j * image.width) * 4];
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
      
      resizeWindow();
      
      shadebob = new Array(nominalWidth);
      for (var i = 0 ; i < nominalWidth ; ++i) {
	  shadebob[i] = new Array(nominalHeight);
	  for (var j = 0 ; j < nominalHeight ; ++j) {
	      shadebob[i][j] = i;
	  }
      }

      palette = new Array(256);
      for (var i = 0 ; i < 256 ; ++i) {
	  palette[i] = new Array(3);
	  palette[i][0] = i;
	  palette[i][1] = i;
	  palette[i][2] = i;
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
	if (alive) bullets[i].y += timeStep * canvasSpeed;
	if (bullets[i].isDead()) {
	    delBullet(bullets, i);
	    continue;
	}
	var dist = (bullets[i].x - player.x) * (bullets[i].x - player.x) +
	    (bullets[i].y - player.y) * (bullets[i].y - player.y);
	if (dist < (14 + 10) * (14 + 10)) {
	    alive = false;
	    delBullet(bullets, i);
	    continue;
	}
	else if (alive && dist < (14 + 32) * (14 + 32) && !bullets[i].grazed) {
	    graze++;
	    bullets[i].grazed = true;
	}
	i++;
    }
}

function drawBobImage(shadebob, image, startx, starty) {
    for (var x = 0 ; x < image.length ; ++x) {
	for (var y = 0 ; y < image[0].length ; ++y) {
	    shadebob[Math.round(startx + x)][Math.round(starty + y)] += image[x][y];
	}
    }
}

function drawBobToCanvas(shadebob, palette) {
    var scale = shadebob.length / canvas.width;
    var img = context2D.createImageData(canvas.width, canvas.height);
    for (var x = 0 ; x < img.width ; ++x) {
	for (var y = 0 ; y < img.height ; ++y) {
	    var pos = (y * img.width + x) * 4;
	    var px = Math.round(x * scale);
	    var py = Math.round(y * scale);
	    var val = Math.round(shadebob[px][py]);
	    if (val > 255) val = 255;
	    img.data[pos] = palette[val][0];
	    img.data[pos + 1] = palette[val][1];
	    img.data[pos + 2] = palette[val][2];
	    img.data[pos + 3] = 255;
	}
    }
    context2D.putImageData(img, 0, 0);
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

    context2D.clearRect(0, 0, canvas.width, canvas.height);

    drawBobImage(shadebob, circle,
		 nominalWidth / 2 + Math.sin(time) * nominalWidth / 3,
		 nominalHeight / 2 + Math.cos(time) * nominalHeight / 3);

    reduceBob(shadebob, 0.9);

    drawBobToCanvas(shadebob, palette);
/*
    context2D.drawImage(circleImage,
			canvas.width / 2 + Math.sin(time) * canvas.width / 3,
			canvas.height / 2 + Math.sin(time) * canvas.height / 3);
*/
}
