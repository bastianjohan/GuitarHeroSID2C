let arrayCircles = [];
let speedCircles = 0.6;
let maxRadius = 300;
// Assign indexes to slice colors
let sliceColors = ['#CCBC61', '#7FCC61', 
'#61CC9E', '#619ECC', '#7F61CC', '#CC9661', '#CC6161'];
let sliceColorIndexes = [0, 1, 2, 3, 4, 5, 6];
let points = 0; // Variable to keep track of points
let hoveredSliceIndex = -1; // Index of the currently hovered slice
let sliceCount = 7;
let fps = 30;
let accuracy = 100;
let hits = 0;

function drawSymbolCircle(x, y){
  fill(0, 0, 0, 0);
  circle(x, y, 10);
}
function drawSymbolSquare(x, y){
  fill(0, 0, 0, 0);
  rect(x - 5, y - 5, 10, 10);
}
function drawSymbolDiamond(x, y){
  fill(0, 0, 0, 0);
  beginShape();
  vertex(x, y - 5); // Top vertex
  vertex(x + 5, y); // Right vertex
  vertex(x, y + 5); // Bottom vertex
  vertex(x - 5, y); // Left vertex
  endShape(CLOSE);
}
function drawSymbolTriangleTop(x, y){
  fill(0, 0, 0, 0);
  triangle(x - 5, y - 4, x, y + 6, x + 5, y - 4);
}
function drawSymbolTriangleTopStripe(x, y){
  fill(0, 0, 0, 0);
  triangle(x - 5, y - 4, x, y + 6, x + 5, y - 4);
  line(x - 5, y - 1, x + 5, y - 1);
}
function drawSymbolTriangleBottom(x, y){
  fill(0, 0, 0, 0);
  triangle(x - 5, y + 4, x, y - 6, x + 5, y + 4);
}
function drawSymbolTriangleBottomStripe(x, y){
  fill(0, 0, 0, 0);
  triangle(x - 5, y + 4, x, y - 6, x + 5, y + 4);
  line(x - 5, y + 1, x + 5, y + 1);
}
 
class Circle {
  constructor(t, a, r, c, sliceIndex, dB){
    this.t = t;
    this.angle = a;
    this.radius = r;
    this.color = c;
    this.sliceIndex = sliceIndex;
    this.x = 0;
    this.y = 0;
    this.awardedPoint = false;
    this.isDistractionBall = dB;
  }
  update(cX, cY){
    let lerpedRadius = lerp(0, maxRadius, this.t);
    this.x = cX + lerpedRadius * cos(this.angle);
    this.y = cY + lerpedRadius * sin(this.angle);
    this.t += speedCircles * (1 / fps);
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
  textFont("Goldman");
  noCursor();
 
  // Call the spawnBall function every 0.5 seconds
  setInterval(spawnBall, 500);

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
      if(!obj.awardedPoint && points > 0 && !obj.isDistractionBall){
        points -= 2;
      }
      arrayCircles.splice(i, 1);
    }
  }
}
 
// Function to spawn a new ball
function spawnBall() {
  //Color
  let colorIndex = Math.round(random(0, sliceCount - 1));
  let color;
  let sliceIndex;
  let isDistractionBall = false;
  randomDistraction = Math.floor(random(5));
  if(randomDistraction == 0){
    let randomColor = -1;
    while(randomColor == colorIndex || randomColor == -1){
      randomColor = Math.round(random(0, sliceCount - 1));
    }
    color = sliceColors[randomColor];
    sliceIndex = sliceColorIndexes[randomColor];
    isDistractionBall = true;
  } else {
    color = sliceColors[colorIndex];
    sliceIndex = sliceColorIndexes[colorIndex];
  }
  //Angle
  angleStart = -PI / 2 + TWO_PI / sliceCount * colorIndex;
  angleEnd = angleStart + TWO_PI / sliceCount;
  angle = random(angleStart + TWO_PI / 70, angleEnd - TWO_PI / 70);
  //Spawn
  arrayCircles.push(new Circle(0, angle, 25, color, sliceIndex, isDistractionBall));
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

function game() {
  updateCircles();
 
  let sliceAngle = TWO_PI / sliceCount;
  textSize(20);
  textAlign(CENTER, CENTER);

  //Rings
  for (let i = 0; i < sliceCount; i++) {
    let startAngle = -PI / 2 + sliceAngle * i;
    let endAngle = startAngle + sliceAngle;
 
    let hovered = isHovered(startAngle, endAngle, i);
    if (hovered) {
        hoveredSliceIndex = i;
    }
 
    let opacity = (i === hoveredSliceIndex) ? 128 : 255;
    let color = sliceColors[i];

    fill(red(color) * 0.8, green(color) * 0.8, blue(color) * 0.8, opacity);
    arc(width / 2, height / 2, 600, 600, startAngle, endAngle, PIE);
    fill(0);
    arc(width / 2, height / 2, 450, 450, startAngle, endAngle, PIE);
    fill(red(color), green(color), blue(color), opacity);
    arc(width / 2, height / 2, 445, 445, startAngle, endAngle, PIE);
    fill(0);
    arc(width / 2, height / 2, 295, 295, startAngle, endAngle, PIE);
    fill(red(color) * 0.8, green(color) * 0.8, blue(color) * 0.8, opacity);
    arc(width / 2, height / 2, 290, 290, startAngle, endAngle, PIE);
    
    // Calculate the middle point of the arc
    let middleAngle = (startAngle + endAngle) / 2;
    let middleX = width / 2 + (270 * cos(middleAngle));
    let middleY = height / 2 + (270 * sin(middleAngle));
 
    // Display the slice index in the middle of the slice
    stroke(255);
    //text(i, middleX, middleY);
    switch(i){
      case 0:
        drawSymbolCircle(middleX, middleY);
        break;
      case 1:
        drawSymbolTriangleBottom(middleX, middleY);
        break;
      case 2:
        drawSymbolSquare(middleX, middleY);
        break;
      case 3:
        drawSymbolTriangleBottomStripe(middleX, middleY);
        break;
      case 4:
        drawSymbolDiamond(middleX, middleY);
        break;
      case 5:
        drawSymbolTriangleTop(middleX, middleY);
        break;
      case 6:
        drawSymbolTriangleTopStripe(middleX, middleY);
        break;
    }
    noStroke();
  }

  fill(0, 0, 0, 255);
  stroke(255);
  strokeWeight(2);
  circle(width / 2, height / 2, 140);
 
  for (let obj of arrayCircles) {
    obj.draw();
    // Display slice index on each ball
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    switch(obj.sliceIndex){
      case 0:
        drawSymbolCircle(obj.x, obj.y);
        break;
      case 1:
        drawSymbolTriangleBottom(obj.x, obj.y);
        break;
      case 2:
        drawSymbolSquare(obj.x, obj.y);
        break;
      case 3:
        drawSymbolTriangleBottomStripe(obj.x, obj.y);
        break;
      case 4:
        drawSymbolDiamond(obj.x, obj.y);
        break;
      case 5:
        drawSymbolTriangleTop(obj.x, obj.y);
        break;
      case 6:
        drawSymbolTriangleTopStripe(obj.x, obj.y);
        break;
    }
  }
 
  fill(255);
  noStroke();
  circle(mouseX, mouseY, 10);
}
 
function draw() {
  fps = frameRate();
  background(0);
  game();
  accuracy = points / hits * (100/3);
  // Display points counter
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text('Points: ' + points, 30, 30);
  text('Accuracy: ' + accuracy.toFixed(1) + "%", 30, 50);
  text("FPS: " + fps.toFixed(0), innerWidth - 120, 30);
  text("1", innerWidth / 2, innerHeight / 2 - 120);
  text("3", innerWidth / 2, innerHeight / 2 - 200);
  text("1", innerWidth / 2, innerHeight / 2 - 280);
}
 
function keyPressed() {
  if (key === ' ') {
    hits++;
    console.log("Hovered Slice Index:", hoveredSliceIndex);
    // Iterate through the balls to find the one that matches the current slice and color
    for (let i = 0; i < arrayCircles.length; i++) {
      let ball = arrayCircles[i];
      // Check if the ball has already been awarded a point or is still in the middle hole
      if (ball.awardedPoint || dist(ball.x, ball.y, width / 2, height / 2) < 70) {
        continue; // Skip this ball if it has already awarded a point or is in the middle hole
      }
      // Calculate the angle of the ball relative to the center
      let ballAngle = atan2(ball.y - height / 2, ball.x - width / 2);
      // Adjust the angle range of the highlighted slice
      let startAngle = (TWO_PI / 5 * hoveredSliceIndex - PI / 2 + TWO_PI) % TWO_PI;
      // Normalize the ball angle to ensure it's within the range [0, TWO_PI)
      ballAngle = (ballAngle + TWO_PI) % TWO_PI;
      // Calculate the slice index of the ball
      let ballSliceIndex = floor((ballAngle + PI / 2) / (TWO_PI / sliceCount)) % sliceCount;
      // Check if the ball's slice index matches the hovered slice index and if its color matches
      if (ballSliceIndex === hoveredSliceIndex && ball.color === sliceColors[hoveredSliceIndex]) {
        // Increment points if the correct ball is in the correct slice
        print(ball.t);
        if (ball.t >= 0.28 && ball.t < 0.52) {
          points++;
        } else if (ball.t >= 0.52 && ball.t < 0.76) {
          points += 3;
        } else {
          points++;
        }
        //console.log("Point awarded because of slice:", hoveredSliceIndex);
        // Set the awardedPoint property to true to indicate that this ball has awarded a point
        ball.awardedPoint = true;
        client.sendMessage("/right", hoveredSliceIndex);
        return; // Break loop after awarding the point
      }
    }
    points -= 2;
    if(points < 0){
      points = 0;
    }
    client.sendMessage("/false", "bang");
  }
}

// //Smoothing

// let bufferX = [];
// let bufferY = [];

// function smooth(buffer, input){
//   let dataPoints = 5;
//   let sum = 0;
//   buffer.push(input);
//   if(buffer.length == dataPoints){
//     for(data of bufferX){
//       returnValue += data;
//     }
//     buffer = [];
//     return sum / dataPoints;
//   } else {
//     return input;
//   }
// }

// function draw(){
//   EyeTrackerX = smooth(bufferX, valueX);
//   EyeTrackerY = smooth(bufferY, valueY);
// }