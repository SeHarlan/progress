const debug = false;
const musicDebug = false

const musicFR = 10

const useWaveLineLength = "wave"

let withMusic = true

let bgColor
let focalRect, secRect;
let focalColor, secColor, focalFactor, secFactor;
let focalAltFuncKey, secAltFuncKey;
let focalRotateBy, secRotateBy;
let focalIndexQuarterStart, secIndexQuarterStart;
let focalR1, focalR2, secR1, secR2;
let focalRhythmReverse

let halfStop;
let scale, rootNote

let focalBuff, secBuff;

let margin

let Bufs = []
let Rects = []

let playButton
let playing = false

let menuContainer, closeButton, fastForwardButton, pauseButton, screenshotButton;
let newButton, replayButton

const isRecording = false
let recorder;
let chunks = [];

const standardFunctionChance = 0.5
// let audioContext;
// let audioRecorder = new Tone.Recorder();
// Tone.Master.connect(audioRecorder);

let stream;
//ffmpeg -i video.webm -i audio.wav -c:v libx264 -c:a aac output.mp4

const AlterIndexFunctions = {
  "standard": (i) => i,
  "cos": (i) => abs(cos(radians(i))),
  "sin": (i) => abs(sin(radians(i))),
  "tan": (i) => abs(tan(radians(i))),
  "sq": (i) => sq(i),
  "sqrt": (i) => sqrt(i)
}
//TODO clean this up, make it simple DUET

//MISC
// [x] make squares align to the largest dimension
// [x] make website to showcase WIP
// [x] menu with replay, next, save screenshot, 
// [x] instructions "m" for menu toggle, "s" for screenshot, space for pause, "f" for fastforward
// [x] rerender with same seed if screen size changes (if easy)
// [x] fine tune stroke width & alpha
// [x] warning if no Tone js

//RYTHM
// [x] examan existing rhythms
// [x] make a few new rhythms (SQUARE WAVE)

//SCALES 
// [x] try out other scales
// [] assign black bg and white to a minor like mode
// [] assign white bg and black to a major like mode

//COLOR
// [x] try purposefull palettes for major/minor~
// [] if not, fine tune the random selection

//FACTORS
// [x] confirm standard factor choices
// [x] make sure they work with other factor functions (trim out fucntions with no variation)

// MUSIC

// [] make sure root note is being hit on shortest
// [] low root note gets played on max dimension range so its more often, then diagonals just go lower 
// [] fine tune octave range
// [] apply compression to music
// [] try reverb (maybe chorus/phase?)
// [] try square waves 
// [] double tap to play/pause

// black and white 1/1 versions w/ _____ scales


//DUET - An iteration of the Cardiod algorithm

function setup() {
  const scl = 0.65
  // createCanvas(2880*scl, 5120*scl);
  // createCanvas(5120*scl, 5120*scl);
  createCanvas(windowWidth, windowHeight)
  colorMode(HSL)
  frameRate(musicFR)

 

  // if (isRecording) {
  //   let stream = document.querySelector('canvas').captureStream(12); // argument is the desired fps
  //   recorder = new MediaRecorder(stream);
  //   recorder.ondataavailable = e => {
  //     chunks.push(e.data);
  //   };
  //   recorder.onstop = () => {
  //     const videoBlob = new Blob(chunks, { type: 'video/webm' });
  //     downloadBlob(videoBlob, "video.webm");
  //   }
  // }

  focalBuff = createGraphics(width, height)
  secBuff = createGraphics(width, height)
  focalBuff.colorMode(HSL)
  secBuff.colorMode(HSL)


  const s = random(1000)
  console.log("seed", s)
  randomSeed(s);

  handleRectSetUp()
  //set up happens on play so mobile devices can play audio

  //UI
  playButton = document.getElementById("play-button")
  playButton.onclick = handlePlayInit

  menuContainer = document.getElementById("instructionContainer")

  closeButton = document.getElementById("closeButton")
  closeButton.onclick = handleCloseMenu

  fastForwardButton = document.getElementById("fastForwardButton")
  fastForwardButton.onclick = handleFastForward
  pauseButton = document.getElementById("pauseButton")
  pauseButton.onclick = handlePlayToggle
  screenshotButton = document.getElementById("screenshotButton")
  screenshotButton.onclick = handleSaveScreenshot

  replayButton = document.getElementById("replayButton")
  replayButton.onclick = handleReplay
  newButton = document.getElementById("newButton")
  newButton.onclick = handleNew

  window.addEventListener("resize", debounce(handleResize, 300))

  //MUTLI RECTS
  // const yspace = (height - (margin * 2)) / 2
  // const xspace = (width - (margin * 2)) / 2
  // for (let y = margin; y < height - margin; y += yspace) {
  //   for (let x = margin; x < width - margin; x += xspace) {
  //     const ABuffer = createGraphics(width, height)
  //     ABuffer.colorMode(HSL)
  //     Bufs.push(ABuffer)

  //     const focalAltFuncKey = random() < standardFunctionChance ? "standard" : random(Object.keys(AlterIndexFunctions));

  //     console.log("Focal Alter Func:", focalAltFuncKey)

  //     const hOffsetOptions = [0, 180]

  //     const hOff = random(hOffsetOptions)
  //     const fH = (bgH + hOff) % 360;
  //     const fS = 80;
  //     const fL = random(40, 90);
  //     const fA = 0.75;
  //     const focalColor = color(fH, fS, fL, fA)

  //     const focalFactor = getFactorOption(focalAltFuncKey)
  //     console.log("focalFactor", focalFactor)

  //     const focX2 = isHorizontal ? width / 2 - margin / 2 : width - margin
  //     const focY2 = isHorizontal ? height - margin : height / 2 - margin / 2

  //     const newRect = new R3CT({
  //       x1: x,
  //       y1: y,
  //       x2: x + xspace,
  //       y2: y + yspace,
  //       measure: 32,
  //       factor: focalFactor,
  //       alterFunction: AlterIndexFunctions[focalAltFuncKey],
  //       color: focalColor,
  //       halfStop,
  //       buffer: ABuffer,
  //       reverse: random() > 0.5
  //     }, {
  //       startingNote: NoteHertz.C[((Bufs.length+1))],
  //       scale: "pentatonic",
  //       waveType: "sine",
  //     })
  //     Rects.push(newRect)
  //   }
  // }

}

function draw() {
  if (playing) playMusic()
}

async function playMusic() {
  if (focalRect.complete && secRect.complete) {
    noLoop()
    console.log("All Complete")

    handleOpenMenu()

    if (isRecording) {
      setTimeout(stopRecording, 1000)
      // recorder.stop();
      // const audioBlob = await audioRecorder.stop();
      // downloadBlob(audioBlob, "audio.wav");
    }

  }

  const secNoteProps = secRect.drawLine()
  const focalNoteProps = focalRect.drawLine()

  focalRect.playNote(...focalNoteProps)
  secRect.playNote(...secNoteProps)


  //MUTLI RECTS
  // if (Bufs[0].complete) {
  //   noLoop()
  //   console.log("All Complete")
  // }
  // Rects.forEach((rect, i) => {
  //   rect.drawLine()
  // })


  background(bgColor)

  //canvas shadow
  const shadowL = lightness(bgColor) >= 20 ? 0 : 100
  const shadowOffset = min(width, height) * 0.0025
  drawingContext.shadowColor = color(hue(bgColor), saturation(bgColor), shadowL, 0.3)
  drawingContext.shadowBlur = shadowOffset*1.5
  drawingContext.shadowOffsetX = 0
  drawingContext.shadowOffsetY = shadowOffset

  image(secBuff, 0, 0)
  image(focalBuff, 0, 0)

  //MUTLI RECTS
  // Bufs.forEach((buf, i) => {
  //   image(buf, 0, 0)
  // })


  if (debug) {
    stroke(0, 0, 100)
    strokeWeight(2)
    const min = Math.min(width, height)
    const margin = min * 0.1;

    line(margin, margin, width - margin, margin)
    line(width - margin, margin, width - margin, height - margin)
    line(width - margin, height - margin, margin, height - margin)
    line(margin, height - margin, margin, margin)
  }

}

function keyPressed() {
  if (key == " ") {
    if (playButton.className !== "hidden") handlePlayInit()
    else handlePlayToggle()
  }
  if (playButton.className !== "hidden") return
  if (key == "m") {
    handleMenuToggle()
  }
  if (key == 's') {
    handleSaveScreenshot()
  }
  if (key == 'f') {
    handleFastForward()
  }
  if (key == "r") {
    handleReplay()
  }
  if (key == "n") {
    handleNew()
  }
  return false
}

function handleRectSetUp() {
  // scale = random(Object.keys(ScaleFunctionsMap))
  scale = Object.keys(ScaleFunctionsMap).sort(() => random() - 0.35)[0]
  console.log("scale", scale)

  const pallette = {
    major: {
      bgH: () => random(360),
      bgS: () => 50,
      bgL: () => random(90, 100),
      rectS: () => 50,
      rectL: () => random(60,80),
    },
    minor: {
      bgH: () => random(360),
      bgS: () => 25,
      bgL: () => random(5, 15),
      rectS: () => 80,
      rectL: () => random(60, 80),
    },
    pentatonic: {
      bgH: () => random(360),//random() > 0.33 ? random(330, 360 + 30) % 360 : random(180, 240),
      bgS: () => 20,
      bgL: () => random(20, 50),
      rectS: () => 65,
      rectL: () => random(50, 80),
    },
    // lydian: {
    //   bgH: () => random(360),
    //   bgS: () => 5,
    //   bgL: () => 95,
    //   rectS: () => 1,
    //   rectL: () => 33,
    // },
    lydian: {
      bgH: () => random(360),
      bgS: () => 1,
      bgL: () => 99,
      rectS: () => 1,
      rectL: () => 5,
    },
    mixolydian: {
      bgH: () => random(360),
      bgS: () => 1,
      bgL: () => 99,
      rectS: () => 1,
      rectL: () => 5,
    },
    // dorian: {
    //   bgH: () => random(360),
    //   bgS: () => 5,
    //   bgL: () => 5,
    //   rectS: () => 1,
    //   rectL: () => 66,
    // },
    dorian: {
      bgH: () => random(360),
      bgS: () => 1,
      bgL: () => 1,
      rectS: () => 1,
      rectL: () => 95,
    },
    phrygian: {
      bgH: () => random(360),
      bgS: () => 1,
      bgL: () => 1,
      rectS: () => 1,
      rectL: () => 95,
    },
  }

  const bgH = pallette[scale].bgH()
  const bgS = pallette[scale].bgS()
  const bgL = pallette[scale].bgL()
  bgColor = color(bgH, bgS, bgL)
  debug && console.log("Bg Hue", bgH)
  background(bgColor);

  const rootNotes = Object.keys(NoteHertz)
  const noteIndex = round(map(bgH, 0, 360, 0, rootNotes.length - 1))
  rootNote = rootNotes[noteIndex]
  console.log("rootNote", rootNote)

  halfStop = random() > 0.95
  console.log("halfStop", halfStop)


  //Focal settings
  focalAltFuncKey = random() < standardFunctionChance ? "standard" : random(Object.keys(AlterIndexFunctions));

  console.log("Focal Alter Func:", focalAltFuncKey)

  const hOffsetOptions = [0, 180]

  const hOff = random(hOffsetOptions)
  const fH = (bgH + hOff) % 360;
  const fS = pallette[scale].rectS();
  const fL = pallette[scale].rectL();
  const fA = 0.75;
  focalColor = color(fH, fS, fL, fA)

  focalFactor = getFactorOption(focalAltFuncKey)
  console.log("focalFactor", focalFactor)

  focalRotateBy = random(5)
  focalIndexQuarterStart = round(random(1, 4))
  focalR1 = getNewRhythm()
  focalR2 = getNewRhythm()
  focalRhythmReverse = random() > 0.66
 

  // Secondary / alt settings
  secAltFuncKey = random() < standardFunctionChance ? "standard" : random(Object.keys(AlterIndexFunctions));
  console.log("Secondary Alter Func:", secAltFuncKey)
  const secHOff = random(hOffsetOptions)
  const secH = (bgH + secHOff) % 360;
  const secS = pallette[scale].rectS();
  const secL = pallette[scale].rectL();
  const secA = 0.75
  secColor = color(secH, secS, secL, secA)


  secFactor = getFactorOption(secAltFuncKey)
  console.log("secFactor", secFactor)

  secRotateBy = random(5)
  secIndexQuarterStart = round(random(1, 4))
  secR1 = getNewRhythm()
  secR2 = getNewRhythm()
}
const getNewRhythm = () => random(Object.keys(RHYTHMS))

const handleRectCreate = () => {
  const isHorizontal = width > height

  const minDimension = min(width, height)
  margin = minDimension * 0.1;


  const focX2 = isHorizontal ? width / 2 - margin / 2 : width - margin
  const focY2 = isHorizontal ? height - margin : height / 2 - margin / 2

  focalRect = new R3CT({
    x1: roundLastDigit(margin),
    y1: roundLastDigit(margin),
    x2: roundLastDigit(focX2),
    y2: roundLastDigit(focY2),
    measure: 32,
    factor: focalFactor,
    alterFunction: AlterIndexFunctions[focalAltFuncKey],
    color: focalColor,
    halfStop,
    buffer: focalBuff,
    rotateBy: focalRotateBy,
    indexQuarterStart: focalIndexQuarterStart,
  }, {
    startingNote: NoteHertz[rootNote][4],
    scale: scale,
    waveType: "sine",
    R1: focalR1,
    R2: focalR2,
    rhythmReverse: focalRhythmReverse
  })


  const secX1 = isHorizontal ? width / 2 + margin / 2 : margin
  const secY1 = isHorizontal ? margin : height / 2 + margin / 2

  secRect = new R3CT({
    x1: roundLastDigit(secX1),
    y1: roundLastDigit(secY1),
    x2: roundLastDigit(width - margin),
    y2: roundLastDigit(height - margin),
    measure: 32,
    factor: secFactor,
    alterFunction: AlterIndexFunctions[secAltFuncKey],
    color: secColor,
    halfStop,
    buffer: secBuff,
    rotateBy: secRotateBy,
    indexQuarterStart: secIndexQuarterStart,
    reverse: true
  },
    {
      startingNote: NoteHertz[rootNote][2],
      scale: scale,
      waveType: "triangle",
      R1: secR1,
      R2: secR2,
      rhythmReverse: false
    }
  )
}

function handleSaveScreenshot() {
  save("DUET-still.png");
}

function handleNormalSpeed() { 
  withMusic = true
  frameRate(musicFR)
  fastForwardButton.textContent = "Fast Forward"
}

function handleFastForward() { 
  if (withMusic) {
    withMusic = false
    frameRate(60)
    fastForwardButton.textContent = "Normal Speed"
  } else {
    handleNormalSpeed()
  }
  handlePlay()
}

function handlePlay() { 
  loop()
  playing = true
  pauseButton.textContent = "Pause"
}
function handlePause() {
  playing = false
  pauseButton.textContent = "Play"
}
function handlePlayToggle() { 
  if (playing) handlePause()
  else handlePlay()
}

function handlePlayInit() {
  Tone.start();
  playButton.className = "hidden"
  handleRectCreate()
  handlePlay()

  if (isRecording) {
    getAudioVideoStream()
    // recorder.start();
    // audioRecorder.start();
  }
}

function handleMenuToggle() { 
  if(menuContainer.className === "in") handleCloseMenu()
  else handleOpenMenu()
}

function handleOpenMenu() { 
  if (playButton.className !== "hidden") return
  menuContainer.className = "in"
}
function handleCloseMenu() { 
  menuContainer.className = "out"
}

function handleReplay(e,resizing = false) {
  background(bgColor);
  focalBuff.clear()
  secBuff.clear()
  focalRect.replay()
  secRect.replay()
  
  if (resizing === false) {
    handleCloseMenu()
    handleNormalSpeed()
  }
  handlePlay()
}

function handleNew() {
  focalRect?.dispose()
  secRect?.dispose()
  handleRectSetUp()
  handleRectCreate()
  handleReplay()
}

function handleResize() {
  resizeCanvas(windowWidth, windowHeight)

  focalBuff = createGraphics(width, height)
  secBuff = createGraphics(width, height)
  focalBuff.colorMode(HSL)
  secBuff.colorMode(HSL)

  secRect?.dispose()
  focalRect?.dispose()

  if (playButton.className === "hidden") {
    handleRectCreate()
    handleReplay(undefined,true)
  }
}

function downloadBlob(blob, name) {
  // Now, we need to create a download link for our new video file
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = name;

  // We simulate a click on the download link, which triggers the browser's download action
  document.body.appendChild(downloadLink);
  downloadLink.click();

  // We don't need the download link on the page anymore, so let's remove it
  document.body.removeChild(downloadLink);
}

async function getAudioVideoStream() {
  // Combine video from canvas and audio from Tone.js

  const mediaStreamDestination = Tone.context.destination.context.createMediaStreamDestination();
  Tone.Destination.connect(mediaStreamDestination);
  const audioStream = mediaStreamDestination.stream;


  const videoStream = document.querySelector('canvas').captureStream(musicFR); // 12 FPS
  stream = new MediaStream([...videoStream.getVideoTracks(), ...audioStream.getAudioTracks()]);
  startRecording();
}

function startRecording() {
  let recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => {
    chunks.push(e.data);
  };
  recorder.onstop = () => downloadBlob(new Blob(chunks), "new-video.webm");
  recorder.start();
  console.log("Recording Started")
}
function stopRecording() {
  console.log("Recording Stopped")
  // Stop all tracks; this will trigger the recorder's "stop" event
  stream.getTracks().forEach(track => track.stop());
}

//round to precision with epsilon
function floorToPrecision(num, precision) {
  // return num
  const mult = pow(10,precision)
  return floor((num + Number.EPSILON) * mult) / mult
}

function roundLastDigit(num) { 
  return round(num / 10) * 10
}

function getStandardFactorOption() {
  return random([
    round(random(2, 13)),
    159.5, 160.5, 161, 161.5,
    215,
    round(random(320, 323)) + random([0, 0.5]),
    round(random(427, 431)),
    513, 513.6, 514, 514.2, 514.6,
    round(random(640, 646)) + random([0, 0.5]),
    647,
    round(random(855, 861)),
    round(random(962, 964)) + random([0, 0.5]),
    round(random(1280, 1284.9), 1)
  ])
}
function getFactorOption(funcType) {
  switch (funcType) { 
    case "standard": return getStandardFactorOption();
    case "cos":
    case "sin":
      return round(random(1, 640));
    case "tan": return round(random(1, 90));
    case "sq":
    case "sqrt":
      return round(random(1, 188));
  }
}

function debounce(func, wait) {
  let timeout;

  return function(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      func.apply(context, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

//TOUCH FUNCTIONS
let touchStartPos = null;
let touchEndPos = null;

const minSwipeDistance = 100;

function touchStarted(e) {
  if (menuContainer.contains(e.target) || e.target === playButton) return
  
  //handle swipe
  touchStartPos = createVector(mouseX, mouseY);
  return false
}
function mousePressed(e) {
  touchStarted(e)
}

function touchEnded(e) {
  if (menuContainer.contains(e.target) || e.target === playButton) return
  if (touchStartPos) { //handle swipe
    touchEndPos = createVector(mouseX, mouseY);

    const swipeVector = p5.Vector.sub(touchEndPos, touchStartPos);
    const swipeDistance = swipeVector.mag();
    if (swipeDistance >= minSwipeDistance) {
      //swipes down / up
      if (touchStartPos.y > touchEndPos.y) {
        handleOpenMenu()
      } else {
        handleCloseMenu()
      }
    }
  }

  //reset touch variables
  touchStartPos = null;
  touchEndPos = null;
  return false;
}
function mouseReleased(e) {
  touchEnded(e)
}