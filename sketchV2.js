let arrayCircles = [];
let speedCircles = 0.01;
let maxRadius = 300;
// Assign indexes to slice colors
let sliceColors = ['#FF0000', '#0000FF', '#FFFF00', '#00FF00', '#FF00FF'];
let sliceColorIndexes = [0, 1, 2, 3, 4];
let points = 0; // Variable to keep track of points
let hoveredSliceIndex = -1; // Index of the currently hovered slice
 
class Circle {
  constructor(t, a, r, c, sliceIndex){
    this.t = t;
    this.angle = a;
    this.radius = r;
    this.color = c;
    this.sliceIndex = sliceIndex;
    this.x = 0;
    this.y = 0;
    this.awardedPoint = false;
  }
  update(cX, cY){
    let lerpedRadius = lerp(0, maxRadius, this.t);
    this.x = cX + lerpedRadius * cos(this.angle);
    this.y = cY + lerpedRadius * sin(this.angle);
    this.t += speedCircles;
  }
  draw(){
    let colorIndex = sliceColors.indexOf(this.color);
    let alpha = this.awardedPoint ? 128 : 255; // Decrease alpha if point has been awarded
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    stroke(255);
    strokeWeight(2);
    circle(this.x, this.y, this.radius * 2);
  }
}
 
 
function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}
 
function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();
 
  // Call the spawnBall function every 0.5 seconds
  setInterval(spawnBall, 250);

  //Server setup for Max DSP
  client = new Client();
  client.startClient('127.0.0.1', 9000);
  server = new Server();
  server.startServer(9001);
  server.getMessage(function(address,msg) {
    oscReceiver(address,msg);
  });
}
 
function updateCircles() {
  for(let i = arrayCircles.length - 1; i >= 0; i--) {
    let obj = arrayCircles[i];
    obj.update(width / 2, height / 2);
    if (obj.t >= 1) {
      arrayCircles.splice(i, 1);
    }
  }
}
 
// Function to spawn a new ball
function spawnBall() {
  let angle = random(0, 360);
  let colorIndex = Math.floor(random(5));
  let color = sliceColors[colorIndex];
  let sliceIndex = sliceColorIndexes[colorIndex]; // Get slice index for the ball
  arrayCircles.push(new Circle(0, angle, 25, color, sliceIndex));
}
 
function isHovered(startAngle, endAngle, sliceIndex) {
  let angleFromCenter = atan2(mouseY - height / 2, mouseX - width / 2);
 
  if (angleFromCenter < 0) {
    angleFromCenter += TWO_PI;
  }
 
  if (startAngle < 0) {
    startAngle += TWO_PI;
  }
  if (endAngle < 0) {
    endAngle += TWO_PI;
  }
 
  let spansZero = endAngle < startAngle;
 
  let hovered;
  if (spansZero) {
    hovered = (angleFromCenter > startAngle || angleFromCenter < endAngle);
  } else {
    hovered = (angleFromCenter > startAngle && angleFromCenter < endAngle);
  }
 
  return hovered;
}
 
function draw() {
  updateCircles();
  background(0);
 
  let sliceAngle = TWO_PI / 5;
 
  for (let i = 0; i < 5; i++) {
    let startAngle = -PI / 2 + sliceAngle * i;
    let endAngle = startAngle + sliceAngle;
 
    let hovered = isHovered(startAngle, endAngle, i);
    if (hovered) {
        hoveredSliceIndex = i;
    }
 
    let opacity = (i === hoveredSliceIndex) ? 128 : 255;
    let color = sliceColors[i];
    fill(red(color), green(color), blue(color), opacity);
    arc(width / 2, height / 2, 600, 600, startAngle, endAngle, PIE);
 
    // Calculate the middle point of the arc
    let middleAngle = (startAngle + endAngle) / 2;
    let middleX = width / 2 + (300 * cos(middleAngle));
    let middleY = height / 2 + (300 * sin(middleAngle));
 
    // Display the slice index in the middle of the slice
    fill(255);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(i, middleX, middleY);
  }
 
  fill(0, 0, 0, 255);
  stroke(255);
  strokeWeight(2);
  circle(width / 2, height / 2, 200);
 
  for (let obj of arrayCircles) {
    obj.draw();
    // Display slice index on each ball
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    text(obj.sliceIndex, obj.x, obj.y);
  }
 
  fill(255);
  noStroke();
  circle(mouseX, mouseY, 10);
 
  // Display points counter
  fill(255);
  textSize(80);
  textAlign(LEFT, TOP);
  text('Points: ', 30, 30)
  text(points, 120, 120);
}
 
function keyPressed() {
  if (key === ' ') {
    console.log("Hovered Slice Index:", hoveredSliceIndex);
    // Iterate through the balls to find the one that matches the current slice and color
    for (let i = 0; i < arrayCircles.length; i++) {
      let ball = arrayCircles[i];
      // Check if the ball has already been awarded a point or is still in the middle hole
      if (ball.awardedPoint || dist(ball.x, ball.y, width / 2, height / 2) < 100) {
        continue; // Skip this ball if it has already awarded a point or is in the middle hole
      }
      // Calculate the angle of the ball relative to the center
      let ballAngle = atan2(ball.y - height / 2, ball.x - width / 2);
      // Adjust the angle range of the highlighted slice
      let startAngle = (TWO_PI / 5 * hoveredSliceIndex - PI / 2 + TWO_PI) % TWO_PI;
      // Normalize the ball angle to ensure it's within the range [0, TWO_PI)
      ballAngle = (ballAngle + TWO_PI) % TWO_PI;
      // Calculate the slice index of the ball
      let ballSliceIndex = floor((ballAngle + PI / 2) / (TWO_PI / 5)) % 5;
      // Check if the ball's slice index matches the hovered slice index and if its color matches
      if (ballSliceIndex === hoveredSliceIndex && ball.color === sliceColors[hoveredSliceIndex]) {
        points++; // Increment points if the correct ball is in the correct slice
        console.log("Point awarded because of slice:", hoveredSliceIndex);
        // Set the awardedPoint property to true to indicate that this ball has awarded a point
        ball.awardedPoint = true;
        client.sendMessage("/right", hoveredSliceIndex);
        return; // Break loop after awarding the point
      }
    }
    client.sendMessage("/false", "bang");
  }
}