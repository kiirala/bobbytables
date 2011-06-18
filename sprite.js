function Sprite(image) {
    this.x = 0;
    this.y = 0;
    this.image = image;
}
Sprite.prototype.minX = function() {
    return this.x - this.image.width / 2;
};
Sprite.prototype.minY = function() {
    return this.y - this.image.height / 2;
};
Sprite.prototype.maxX = function() {
    return this.x + this.image.width / 2;
};
Sprite.prototype.maxY = function() {
    return this.y + this.image.height / 2;
};

function Player(image, x, y) {
    this.x = x;
    this.y = y;
    this.image = image;
    this.bullets = dynamicArray();
    this.lastShot = 0;
}
Player.prototype = new Sprite();

function Bullet(image, x, y, speedx, speedy, accelx, accely) {
    this.x = x;
    this.y = y;
    this.speedx = speedx;
    this.speedy = speedy;
    this.accelx = accelx;
    this.accely = accely;
    this.image = image;
    this.grazed = false;
}
Bullet.prototype = new Sprite();
Bullet.prototype.move = function(time) {
    this.speedx += this.accelx * time;
    this.speedy += this.accely * time;
    this.x += this.speedx * time;
    this.y += this.speedy * time;
};
Bullet.prototype.isDead = function() {
    if (this.maxX() < x || this.minX() >= x + nominalWidth ||
	this.maxY() < y || this.minY() >= y + nominalHeight)
	return true;
    else
	return false;
};

function TestEnemy(image, x, y) {
    this.image = image;
    this.x = x;
    this.y = y;
    this.time = 0;
    this.seqPos = 0;	
}
TestEnemy.prototype = new Sprite();
TestEnemy.prototype.sequence = [
    [1.0, shootCircle, 16, 0],
    [0.4, shootCircle, 16, 0],
    [0.4, shootCircle, 16, 0],

    [1.0, shootCircle, 16, 0],
    [0.4, shootCircle, 16, 0.1],
    [0.4, shootCircle, 16, 0.2],
    [0.4, shootCircle, 16, 0.3],
    [0.4, shootCircle, 16, 0.4],

    [0.4, shootCircle, 16, 0.5],
    [0.4, shootCircle, 16, 0.4],
    [0.4, shootCircle, 16, 0.3],
    [0.4, shootCircle, 16, 0.2],
    [0.4, shootCircle, 16, 0.1],

];

TestEnemy.prototype.update = function(time) {
    this.time += time;
    if (this.time >= this.sequence[this.seqPos][0]) {
	this.sequence[this.seqPos][1](this.x, this.y, this.sequence[this.seqPos][2], this.sequence[this.seqPos][3]);
	this.time -= this.sequence[this.seqPos][0];
	this.seqPos++;
	if (this.seqPos >= this.sequence.length) {
	    this.seqPos = 0;
	}
    }
};

function addBullet(bullets, bullet) {
    if (bullets.used == bullets.length) {
	bullets.push(bullet);
    }
    else {
	bullets[bullets.used] = bullet;
    }
    bullets.used++;
}
function delBullet(bullets, index) {
    bullets.used--;
    bullets[index] = bullets[bullets.used];
}

function shootCircle(image, x, y, count, start) {
    for (var alpha = start ;
	 alpha < 2 * Math.PI + start ;
	 alpha += Math.PI / (count / 2)) {
	var cos = Math.cos(alpha);
	var sin = Math.sin(alpha);
	addBullet(bullets, new Bullet(image,
				      x + cos * 32, y + sin * 32,
				      cos * bulletSpeed,
				      sin * bulletSpeed,
				      cos * bulletSpeed * 0.1,
				      sin * bulletSpeed * 0.1));
    }
}
