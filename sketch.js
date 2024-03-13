let arrayCircles = [];
let speedCircles = 0.01;
let maxRadius = 300;
let centerX = innerWidth / 2;
let centerY = innerHeight / 2;

class Circle {
  constructor(t, a, r){
    this.t = t;
    this.angle = a;
    this.radius = r;
    this.x = 0;
    this.y = 0;
  }
  update(cX, cY){
    let lerpedRadius = lerp(0, maxRadius, this.t);
    this.x = cX + lerpedRadius * cos(this.angle);
    this.y = cY + lerpedRadius * sin(this.angle);
    this.t += speedCircles;
  }
  draw(){
    circle(this.x, this.y, this.radius);
  }
}

function setup() {
  createCanvas(innerWidth, innerHeight);
  noFill();
  strokeWeight(3);
  stroke(255);
}

function update(){
  for(let i = arrayCircles.length - 1; i >= 0; i--) {
    let obj = arrayCircles[i];
    obj.update(centerX, centerY);
    if (obj.t >= 1) {
      arrayCircles.splice(i, 1);
    }
  }
}

function draw() {
  update();
  background(0);
  circle(centerX, centerY, 600);
  circle(centerX, centerY, 10);
  for(obj of arrayCircles){
    obj.draw();
  }
}

function keyPressed(){
  if (keyCode === 32) {
    let angle = random(0, 360);
    console.log(angle);
    arrayCircles.push(new Circle(0, angle, 50));
  }
}