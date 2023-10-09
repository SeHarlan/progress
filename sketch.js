let blockBrushes = []
let lifes = []
let flowField;
let blockSize;
let blockSizes = [50, 100, 200]
let speed = 5
let maxBlockLifeSpan = 500

let palette


//TODO
// block types
//  solid b&w
//  random from palette
// strips
// divided in triangles
    

function getPalette() {
  return random([
    [color(279, 18, 84), color(336, 26, 65), color(337, 39, 45), color(342, 40, 48), color(158, 31, 7)],
    [color(30, 11, 4), color(199, 27, 18), color(31, 33, 88), color(32, 33, 67), color(33, 20, 31)],
    [color(254, 31, 40), color(311, 18, 83), color(189, 100, 97), color(182, 42, 72), color(225, 54, 14)],
    [color(85, 61, 93), color(67, 8, 80), color(261, 9, 69), color(285, 92, 9), color(268,44,35)],
    [color(40, 23, 3), color(227, 10, 28), color(350, 49, 29), color(350, 51, 38), color(60, 100, 99)],
    [color(45, 4, 20), color(62, 25, 22), color(36, 59, 31), color(32, 75, 49), color(34, 100, 61)],
    [color(37, 82, 61), color(352, 60, 55), color(188, 100, 27), color(207, 49, 37), color(200, 100, 18)],
    // [color(26,28,67), ]
  ])
}

const numBlocks = {
  50: 8,
  100: 5,
  200: 3
}

const floorToBucket = (num, bucketSize) => { 
  return bucketSize * floor(num / bucketSize)
}

function seedRandom(s) {
  let x = Math.sin(s) * 10000;
  return x - Math.floor(x);
}

function setup() {
  colorMode(HSL)
  blockSize = random(blockSizes)
  const dubBS = blockSize*2
  const cw = floorToBucket(windowWidth*0.95, dubBS)
  const ch = floorToBucket(windowHeight*0.95, dubBS)

  createCanvas(cw, ch);
  frameRate(60)
  
  initBlocks(blockSize)
}


//based on dif between white and black blocks determines note (adding grey means weighted to lower notes)
//base this on 1/4th?
//hieght is volume, width is pan
//moving mean playing?
//make noise for internal shuffling loop so its the same motif


function draw() {

  blockBrushes.forEach(block => {
    block.draw();
    block.move(flowField);
    block.shiftPattern();
    if (frameCount % 200 === 0) {
      if (!block.inSpace || block.lifeSpan < 0) block.reset()
      block.flowField.shiftField()
    }
  })

  for (let i = lifes.length - 1; i >= 0; i--) { 
    const life = lifes[i]
    life.checkDeath()
    if (life.isDead) {
      lifes.splice(i, 1)
      continue;
    }
    life.show()
    life.move()
    if (random() < 0.09) {
      life.birth()
    }
  }

  if (frameCount % 300 === 0 && random() < 0.5) {
    initLifes()
  }
  drawBorder()
}

function keyPressed() {
  if (key == "n") {randomizePattern
    initBlocks()
  }
}

//TOUCH FUNCTIONS
let lastTouchTime = 0;
const doubleTapInterval = 400; // Time in milliseconds between taps to be considered a double tap

function touchStarted(e) {
  let currentTime = millis();
  if (currentTime - lastTouchTime < doubleTapInterval) {
    //handle double tap
    initBlocks()
  }
  // double tap
  lastTouchTime = currentTime;
  return false
}
function mousePressed(e) {
  touchStarted(e)
}

function drawBorder() {
  strokeWeight(speed*2)
  stroke(palette[floor(palette.length / 2)])
  line(0, 0, width - 0, 0)
  line(width - 0, 0, width - 0, height - 0)
  line(width - 0, height - 0, 0, height - 0)
  line(0, height - 0, 0, 0)
}


function initBlocks() {
  background(0, 0, 0);
  palette = getPalette()
  blockBrushes = []
  const dim = max(width, height)

  const mult = floorToBucket(dim/numBlocks[blockSize], blockSize*2)
  for (let y = 0; y < height; y += mult) {
    for (let x = 0; x < width; x += mult) {
      blockBrushes.push(
        new BlockBrush(x, y, blockSize, speed, blockBrushes.length + 1)
      )
    }
  }


  lifes = []
  initLifes()
}

let newPaletteChance = 0

function initLifes() {
  if (random() < newPaletteChance) {
    palette = getPalette()
    newPaletteChance = 0

    blockBrushes.forEach(block => {
      block.randomizePattern()
    })
  } else {
    newPaletteChance += 0.066
  }
  
  let x = floorToBucket(random(width), speed)
  let y = floorToBucket(random(height), speed)

  occupied = blockBrushes.find(block => {
    const blockX1 = block.position.x
    const blockY1 = block.position.y
    const blockX2 = blockX1 + block.size
    const blockY2 = blockY1 + block.size

    const xIntersect = x >= blockX1 && x <= blockX2 || x + this.speed >= blockX1 && x + this.speed <= blockX2
    const yIntersect = y >= blockY1 && y <= blockY2 || y + this.speed >= blockY1 && y + this.speed <= blockY2
    return xIntersect && yIntersect
  })    
  if (occupied) return

  for (let i = 0; i < 4; i++) {
    direction = map(i, 0, 4, 0, TWO_PI)
    const index = floor(random(palette.length))
    lifes.push(new Life(x, y, direction, speed, palette, index))
  }
}
class Life {
  constructor(x, y, direction, speed, palette, paletteIndex, initDirection = null, lifeSpan = null) {
    this.pos = createVector(x, y)
    this.direction = floorToBucket(direction, PI / 2)
    this.initDirection = initDirection || direction
    this.speed = speed
    this.palette = palette
    this.paletteIndex = paletteIndex
    this.isDead = false
    this.lifeSpan = lifeSpan ?? min(width, height) / speed * random(0.25,1)
  }

  show() {
    noStroke()
    fill(this.palette[this.paletteIndex])
    square(this.pos.x, this.pos.y, this.speed)
  }
  move() {
    const newX = this.pos.x + cos(this.direction) * this.speed
    const newY = this.pos.y + sin(this.direction) * this.speed
    this.pos = createVector(newX, newY)
    this.lifeSpan--
  }
  birth() {
    const isGridAligned = this.pos.x % this.speed === 0 && this.pos.y % this.speed === 0
    if (!isGridAligned) return
    
    let newDirection = this.direction + random([-PI / 2, PI / 2])
    
    const newIndex = random() < 0.6
      ? this.paletteIndex
      : constrain(this.paletteIndex + random([-1, 1]), 0, this.palette.length - 1);
    
    const lifeSpan = this.lifeSpan * random(0.25, 1.1)
    lifes.push(new Life(this.pos.x, this.pos.y, newDirection, this.speed, this.palette, newIndex, this.initDirection, lifeSpan));
  }
  checkDeath() {
    //if off screen, die
    if (this.lifeSpan <= 0) {
      return this.isDead = true
    }
    if(this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
      return this.isDead = true
    }
  }
}
class FlowField {
  constructor(blockSize, offSet) {
    this.blockSize = blockSize
    this.angles = []
    this.offSet = offSet
    this.offSetShift = 0.1
    this.ratio = 0.0005;


    this.buildField()
  }

  buildField() {
    this.angles = []
    const yMax = height / this.blockSize
    const xMax = width / this.blockSize
    for (let yInd = 0; yInd < yMax; yInd++) {
      this.angles.push([])
      for (let xInd = 0; xInd < xMax; xInd++) {
        let angle
        if (random() < 0.05) angle = null
        else {
          const x = xInd * this.blockSize
          const y = yInd * this.blockSize
          angle = this.getFlowAngleValue(x, y, this.offSet, this.ratio)
        }
        this.angles[yInd][xInd] = angle
      }
    }
  }

  shiftField() {
    this.offSet += this.offSetShift
    this.buildField()
  }

  getFlowAngleValue(x, y, offSet, ratio) {
    const normAN = noise(x * ratio + offSet, y * ratio + offSet)
    const angle = floor(map(normAN, 0, 1, 0, 8)) * PI / 2
    return angle
  }

  getAngle(x, y) {
    const cx = constrain(x, 0, width)
    const cy = constrain(y, 0, height)
    let xInd = floor(cx / this.blockSize)
    let yInd = floor(cy / this.blockSize)
    return this.angles[yInd][xInd]
  }

  draw() {
    this.angles.forEach((row, yInd) => {
      row.forEach((angle, xInd) => {
        if (angle === null) return;
        const len = this.blockSize / 2
        const x1 = (xInd * this.blockSize) + len / 2
        const y1 = (yInd * this.blockSize) + len / 2
        fill(0, 0, 100)
        circle(x1, y1, len)

        const x2 = x1 + cos(angle) * len
        const y2 = y1 + sin(angle) * len
        stroke(0, 0, 0)

        line(x1, y1, x2, y2)
      })
    })
  }
}

let brushColIndex = 0
class BlockBrush {
  constructor(x, y, size, space, id = random(1000)) {
    this.position = createVector(x, y)
    this.size = size
    this.space = space
    this.pattern = []
    this.flowField = []
    this.moveSpeed = space
    this.shiftRatio = 0.05
    this.prevAngle = null
    this.id = id
    this.flowField = new FlowField(size, random(1000))
    this.lifeSpan = maxBlockLifeSpan

    let yInd = 0
    for (let py = y; py < y + size; py += space) {
      this.pattern.push([])
      for (let px = x; px < x + size; px += space) {
        this.pattern[yInd].push(this.getRandColor(px, py))
      }
      yInd++
    }
    brushColIndex = (brushColIndex + 1) % 2
  }

  getRandColor(x,y) {
    const blockColors = [color(0, 0, 0), color(0, 0, 100)]
    return random(blockColors)
    // return blockColors[brushColIndex]

    //FROM PALETTE
    // const nScale  = 0.05
    // const pIndex = floor(map(noise(x*nScale,y*nScale), 0,1, 0, palette.length))
    // return palette[pIndex]
  }

  checkPosition(x1, y1, x2, y2) { 
    const occupied = blockBrushes.find(block => {
      if (this.id === block.id) return false

      const blockX1 = block.position.x
      const blockY1 = block.position.y
      const blockX2 = blockX1 + block.size
      const blockY2 = blockY1 + block.size

      const xIntersect = x1 >= blockX1 && x1 <= blockX2 || x2 >= blockX1 && x2 <= blockX2
      const yIntersect = y1 >= blockY1 && y1 <= blockY2 || y2 >= blockY1 && y2 <= blockY2
      return xIntersect && yIntersect
    })
    return Boolean(occupied)
  }

  move() {
    this.lifeSpan--;
    let angle;

    const isGridAligned = this.position.x % this.size === 0 && this.position.y % this.size === 0
    const inSpaceFull = this.position.x >= 0 && this.position.x <= width - this.size && this.position.y >= 0 && this.position.y <= height - this.size
    this.inSpace = this.position.x > -this.size && this.position.x < width && this.position.y > -this.size && this.position.y < height
    if (isGridAligned && inSpaceFull) {
      angle = this.flowField.getAngle(this.position.x, this.position.y)
      this.prevAngle = angle
    } else {
      angle = this.prevAngle
    }

    if (angle === null) return

    let newX = this.position.x + cos(angle) * this.moveSpeed
    let newY = this.position.y + sin(angle) * this.moveSpeed

    const dfSize = this.size * 0.99

    const centerX = this.position.x + this.size / 2
    const centerY = this.position.y + this.size / 2

    const dfXCenter = centerX + cos(angle) * (this.size + dfSize) * 0.5
    const dfYCenter = centerY + sin(angle) * (this.size + dfSize) * 0.5
    
    const dfX1 = dfXCenter - dfSize/2
    const dfY1 = dfYCenter - dfSize/2
    const dfX2 = dfXCenter + dfSize/2
    const dfY2 = dfYCenter + dfSize/2

    // square(this.position.x, this.position.y, this.size)
    
    // noStroke()
    // fill(0,100,50,0.25)
    // beginShape()
    // vertex(dfX1, dfY1)
    // vertex(dfX2, dfY1)
    // vertex(dfX2, dfY2)
    // vertex(dfX1, dfY2)
    // endShape(CLOSE)

    if (isGridAligned) {
      const posOccupied = this.checkPosition(dfX1, dfY1, dfX2, dfY2)
      if (posOccupied) return
    }

    if (newX < -this.size) newX = width;
    if (newX > width) newX = -this.size;
    if (newY < -this.size) newY = height;
    if (newY > height) newY = -this.size;

    newX = round(newX)
    newY = round(newY)

    this.position = createVector(newX, newY)
    this.lifeSpan = maxBlockLifeSpan
  }

  shiftPattern() {
    for (let yInd = 0; yInd < this.pattern.length; yInd++) {
      for (let xInd = 0; xInd < this.pattern[0].length; xInd++) {
        const ratio = this.shiftRatio
        const xInput = xInd * ratio + (this.id*0.1)
        const yInput = yInd * ratio + (this.id*0.1)
        const yN = noise(xInput, yInput, frameCount * ratio)
        const xN = noise(xInput + 100, yInput + 100, frameCount * ratio + 100)

        let newYInd = yInd + round(map(yN, 0, 1, -1, 1))
        let newXInd = xInd + round(map(xN, 0, 1, -1, 1))

        if (newYInd < 0) newYInd = this.pattern.length - 1
        if (newYInd >= this.pattern.length) newYInd = 0

        if (newXInd < 0) newXInd = this.pattern[0].length - 1
        if (newXInd >= this.pattern[0].length) newXInd = 0

        this.pattern[yInd][xInd] = this.pattern[newYInd][newXInd]
      }
    }
  }

  reset() {
    const spaceCount = floor(width / this.size)
    let posOccupied = true
    let x, y
    let tries = 0
    while (posOccupied && tries < 10) {
      tries++
      const rand = this.size * floor(random(spaceCount)) 
      
      switch (this.prevAngle) {
        case 0: {
          x = -this.size
          y = rand
          break;
        }
        case PI / 2: { 
          x = rand
          y = -this.size
          break;
        }
        case PI: { 
          x = width
          y = rand
          break
        }
        case PI * 1.5: { 
          x = rand
          y = height
          break
        }
      }
      const x2 = x + this.size
      const y2 = y + this.size
      posOccupied = this.checkPosition(x,y,x2,y2)
    }
    this.position = createVector(x, y)
    this.randomizePattern()
  }

  randomizePattern() {
    for (let yInd = 0; yInd < this.pattern.length; yInd++) {
      for (let xInd = 0; xInd < this.pattern[0].length; xInd++) {
        const x = this.position.x + (this.space * xInd)
        const y = this.position.y + (this.space * yInd)
        this.pattern[yInd][xInd] = this.getRandColor(x, y)
      }
    }
  }

  draw() {
    noStroke()
    for (let yInd = 0; yInd < this.pattern.length; yInd++) {
      const y = this.position.y + (this.space * yInd)
      for (let xInd = 0; xInd < this.pattern[0].length; xInd++) {
        const x = this.position.x + (this.space * xInd)
        const col = this.pattern[yInd][xInd]
        fill(col)
        square(x, y, this.space)

      }
    }
  }
}