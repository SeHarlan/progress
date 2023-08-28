function drawBGTexture(textBuff, type) {
  switch (type) {
    case "dots": return drawDots(textBuff);
    case "lines": return drawLines(textBuff);
    case "bubbles": return drawBubbles(textBuff);
    case "squares": return drawSquares(textBuff);
    case "shattered": return drawShattered(textBuff);
    case "flowField": return drawFlowField(textBuff);
  }
}
//feed a count so it can be animated on demand (during screen resizing)
function drawDots(textBuff) {


  for (let i = 0; i < (width * height) / 50; i++) {
    const rat = 0.005
    let x = map(noise(i * rat +1), 0, 1, -width*0.5, width*1.5)//random(width)
    let y = map(noise(i * rat), 0, 1, -height * 0.5, height * 1.5)//random(height)
    
    if (x < 0 || x > width) x = random(width)
    if (y < 0 || y > height) y = random(height)
    const minD = min(width, height)
    const r = random(1, minD * 0.003)
    const c = color(random(360), 0, random(100), random(0.1,0.2))
    if (random() > 0.5) {
      textBuff.fill(c)
      textBuff.noStroke()
      textBuff.circle(x-r, y+r, r)
    } else {
      textBuff.stroke(c)
      textBuff.strokeWeight(r)
      textBuff.line(x, y, x + r, y - r)
    }
  }
}

function drawLines(textBuff) { 
  // goes with w bg?
  for (let i = 0; i < (width * height) / 15; i++) { 
    const x = random(width)
    const y = random(height)
    const minD = min(width, height)
    const r = 1
    const c = color(random(360), 0, random(100), random(0.05, 0.15))
    
    textBuff.stroke(c)
    textBuff.strokeWeight(r)
    const useFlip = x > width / 2
    const flip = useFlip ? -1 : 1
    const xOff = random(width / 2 * flip)
    const yOff = random(height / 2 * flip)
    textBuff.line(x, y, x + xOff, y - yOff)
  }
}

function drawBubbles(textBuff) { 
  // goes w black bg?
  for (let i = 0; i < (width * height) / 100; i++) {
    const x = random(width)
    const y = random(height)
    const minD = min(width, height)
    const r = random(1, minD * 0.25)
    const c = color(random(360), 0, random(50), random(0.05, 0.15))
      textBuff.noFill(c)
      textBuff.stroke(c)
      textBuff.circle(x, y, r)
  }
}

function drawSquares(textBuff) { 
  const r = 50

  for (let x = 0; x < width; x += r) {
    for (let y = 0; y < height; y += r) {

      const hr= random(360)
      const lr = random(50)
      const c = color(hr, 90, lr, random(0.1, 0.2))
      textBuff.fill(c)
      textBuff.noStroke(c)
      textBuff.square(x, y, r)
      textBuff.circle(x, y, r/3)
  
    }
  }
}

function drawFlowField(textBuff) { 
  const div = 10

  for (let x = 0; x < width; x += div) { 
    for (let y = 0; y < height; y += div) { 
      const c = color(random(360), 0, random(50), random(0.1, 0.3))
      const rat = 0.001
      const ang = map(noise(x * rat, y * rat), 0, 1, 0, TWO_PI)
      const minD = min(width, height)
      const r = random(div, minD * 0.1)
      const x2 = x + cos(ang) * r
      const y2 = y + sin(ang) * r
      textBuff.noFill(c)
      textBuff.stroke(c)
      textBuff.line(x,y, x2,y2)
    }
  }
}

function drawShattered(textBuff) {
  // goes with black bg (or choose hue to match)
  const margin = 0
  const totalLife = 15

  const hr = random(0, 360)

  let a = createVector(margin, margin);
  let b = createVector(width - margin, height - margin);
  let c = createVector(margin, height - margin);
  balanceTriangleRec(a, b, c, totalLife)

  let d = createVector(width - margin, margin);
  balanceTriangleRec(a, b, d, totalLife)

  function balanceTriangleRec(a, b, c, life) {
    
    const lMin = 5
    const lMax = map(a.dist(createVector(width/2, height/2)), 0, max(width, height)*1.25, lMin, 60)
    const lr = random(lMin, lMax)
    const sr = random(40, 50)
    textBuff.fill(hr, sr, lr)
    textBuff.noStroke()

    // stroke(0,0,0,map(life, totalLife, 0, 1, 0), true)
    textBuff.beginShape()
    textBuff.vertex(a.x, a.y)
    textBuff.vertex(b.x, b.y)
    textBuff.vertex(c.x, c.y)
    textBuff.endShape(CLOSE)

    if (life <= 0) return;
    let range = map(life, totalLife, 0, 0.1, 0.5, true)
    const t = constrain(randomGaussian(0.5, 0.5), 0.5 - range, 0.5 + range)

    //   let range = map(life, totalLife-1, 0, 0.1, 0.5, true)
    //   const t = map(noise(life*0.1, frameCount*0.01), 0,1, 0.5-range, 0.5+range)

    // const t = random(0,1)

    let longestSide = [a, b]
    let side2 = [b, c]
    let side3 = [c, a]
    let longestDist = a.dist(b)
    if (b.dist(c) > longestDist) {
      longestSide = [b, c]
      side2 = [c, a]
      side3 = [a, b]
      longestDist = b.dist(c)
    }
    if (c.dist(a) > longestDist) {
      longestSide = [c, a]
      side2 = [a, b]
      side3 = [b, c]
    }



    let x = lerp(longestSide[0].x, longestSide[1].x, t);
    let y = lerp(longestSide[0].y, longestSide[1].y, t);
    let mp = createVector(x, y);

    balanceTriangleRec(side2[0], side2[1], mp, life - 1)
    balanceTriangleRec(side3[0], side3[1], mp, life - 1)
  }
}
