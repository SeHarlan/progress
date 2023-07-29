const debug = false;
const musicDebug = false

const musicFR = 10

const useWaveLineLength = "wave"

let withMusic = true

let bgColor
let focalRect, secRect;

let halfStop;

let focalBuff, secBuff;

let playButton
let playing = false;

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

//An iteration of the Cariod algorithm

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

  const isHorizontal = width > height

  const min = Math.min(width, height)
  const margin = min * 0.1;

  const bgH = floor(random(180, 360 + 60) % 360)//floor(random(360))//
  const bgS = 35
  const bgL = random(0, 20)
  bgColor = color(bgH, bgS, bgL)
  debug && console.log("Bg Hue", bgH)
  background(bgColor);

  halfStop = random() > 0.95
  console.log("halfStop", halfStop)

  //Focal settings
  const focalAltFuncKey = random() < standardFunctionChance ? "standard" : random(Object.keys(AlterIndexFunctions));

  console.log("Focal Alter Func:", focalAltFuncKey)

  const hOffsetOptions = [0, 180] 

  const hOff = random(hOffsetOptions)
  const fH = (bgH + hOff) % 360;
  const fS = 80;
  const fL = random(40, 90);
  const fA = 0.75;
  const focalColor = color(fH, fS, fL, fA)

  const focalFactor = getFactorOption(focalAltFuncKey)
  console.log("focalFactor", focalFactor)

  const focX2 = isHorizontal ? width / 2 - margin / 2 : width - margin
  const focY2 = isHorizontal ? height - margin : height / 2 - margin / 2

  focalRect = new R3CT({
    x1: margin,
    y1: margin,
    x2: focX2,
    y2: focY2,
    measure: 32,
    factor: focalFactor,
    alterFunction: AlterIndexFunctions[focalAltFuncKey],
    color: focalColor,
    halfStop,
    buffer: focalBuff,
  }, {
    startingNote: NoteHertz.C[2],
    scale: "minor",
    waveType: "sine",
  })

  // Secondary / alt settings
  const secAltFuncKey = random() < standardFunctionChance ? "standard" : random(Object.keys(AlterIndexFunctions));
  console.log("Secondary Alter Func:", secAltFuncKey)
  const secHOff = random(hOffsetOptions)
  const secH = (bgH + secHOff) % 360;
  const secS = 80;
  const secL = random(30, 80)
  const secA = 0.75//0.2;
  const secColor = color(secH, secS, secL, secA)

  const secFactor = getFactorOption(secAltFuncKey)
  console.log("secFactor", secFactor)

  const secX1 = isHorizontal ? width / 2 + margin / 2 : margin
  const secY1 = isHorizontal ? margin : height / 2 + margin / 2

  secRect = new R3CT({
    x1: secX1,
    y1: secY1,
    x2: width - margin,
    y2: height - margin,
    measure: 32,
    factor: secFactor,
    alterFunction: AlterIndexFunctions[secAltFuncKey],
    color: secColor,
    halfStop,
    buffer: secBuff,
    // startIndex: 0,
    reverse: true
  },
    {
      startingNote: NoteHertz.C[1],
      scale: "minor",
      waveType: "triangle",
    }
  )

  //UI
  playButton = document.getElementById("play-button")
  playButton.onclick = handlePlay 

}

function draw() {
  if (playing) playMusic()
}

async function playMusic() {
  if (focalRect.complete && secRect.complete) {
    noLoop()
    console.log("All Complete")

    if (isRecording) {
      setTimeout(stopRecording, 1000)
      // recorder.stop();
      // const audioBlob = await audioRecorder.stop();
      // downloadBlob(audioBlob, "audio.wav");
    }
   
  }

  secRect.drawLine()  
  focalRect.drawLine()


  background(bgColor)
  image(secBuff, 0, 0)
  image(focalBuff, 0, 0)


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
  // If you hit the s key, save an image
  if (key == 's') {
    save("mySketch.png");
  }

  if (key == 'f') {
    if (withMusic) {
      withMusic = false
      frameRate(60)
    } else {
      withMusic = true
      frameRate(musicFR)
    }
  }
  if (key == " ") {
    handlePlay()
    return false
  }
}

function handlePlay() {
  Tone.start();
  playButton.className = "hidden"
  playing = !playing

  if (isRecording) {
    getAudioVideoStream()
    // recorder.start();
    // audioRecorder.start();
  }
}

//TODO clean this up, make it simple DUET

//MISC
// [x] make squares align to the largest dimension
// [x] make website to showcase WIP
// start menue with, no music/music options + shortcuts (save image and fastforward), space bar to pause
// [] add replay button, next button (or automatic checkbox?) shortcut to turn on automatic replay
// [] rerender with same seed if screen size changes (if easy)
// [x] fine tune stroke width & alpha
// [] warning if no Tone js

//RYTHM
// [] examan existing rythms
// [] make a few new rythms (SQUARE WAVE)

//SCALES 
// [] try out other scales
//     {} if enough scales assign palettes to scales
//     {} else assign palettes to root notes

//COLOR
// [] try purposefull palettes for major/minor~
// [] if not, fine tune the random selection

//FACTORS
// [x] confirm standard factor choices
// [x] make sure they work with other factor functions (trim out fucntions with no variation)

// MUSIC
// [] apply compression to music
// [] try reverb (maybe chorus/phase?)
// [] try square waves 

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
  const mult = 10 * precision
  return Math.floor((num + Number.EPSILON) * mult) / mult
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