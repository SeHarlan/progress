class R3CT {
  constructor(
    { x1, y1, x2, y2, measure, factor, alterFunction, color, startIndex, halfStop, buffer, borderBuffer, reverse, rotateBy, indexQuarterStart, decoType },
    { startingNote = 220, //220hz (A3) as lowest note
      scale = "pentatonic",
      waveType = random(['sine', 'triangle']),
      R1 = random(Object.keys(RHYTHMS)),
      R2 = random(Object.keys(RHYTHMS)),
      rhythmReverse = random([true, false]),
      useDelay = random() < 0.33,
      useBitcrusher = random() < 0.33,
    }
  ) {
    this.buffer = buffer
    this.borderBuffer = borderBuffer
    this.reverse = reverse
    this.rhythmReverse = rhythmReverse

    console.log("Rhythm Reversed:", rhythmReverse)

    this.complete = false;
    this.borderPoints = [];
    this.iterations = 0;

    this.waveType = waveType


    //diagnal length
    const diagLen= dist(x1, y1, x2, y2)

    //horizontal or vertical length
   const horLen = max(x2 - x1, y2 - y1)

    this.maxDist = diagLen * 0.5 + horLen * 0.5

    this.measureDiv = 2 //used for rhythm
    this.measure = measure;

    this.Xstep = (x2 - x1) / (this.measure * 10); //320 divisions w/ 32 measure length
    this.Ystep = (y2 - y1) / (this.measure * 10); //320 divisions

    this.factor = factor;
    this.alterFunction = alterFunction;
    this.color = color;
    this.halfStop = halfStop;


    this.startingNote = startingNote
    this.scale = scale

    
    this.synth = new Tone.Synth({
      oscillator: {
        type: this.waveType
      }
    })

    this.useBitcrusher = useBitcrusher
    this.useDelay = useDelay

    this.decoType = decoType


    const gain1 = new Tone.Gain(1.5)
    const delay = new Tone.PingPongDelay("4n", 0.2)
    const delEq = new Tone.EQ3(-5, 0, 2)
    delay.connect(delEq)
    delay.wet.value = this.useDelay ? 0.25 : 0

    const compressor = new Tone.Compressor({
      ratio: 5,
      threshold: -30,
      release: 0.25,
      attack: 0.003,
      knee: 30
    })
    const compressor2 = new Tone.Compressor({
      ratio: 20,
      threshold: -5,
      release: 0.25,
      attack: 0.003,
      knee: 30
    })

    const bitCrusher = new Tone.BitCrusher(4)
    const bdEq = new Tone.EQ3(0, -2, -8)
    bitCrusher.connect(bdEq)
    
    bitCrusher.wet.value = this.useBitcrusher ? 0.25 : 0

    const vibrato = new Tone.Vibrato(5, 0.1)
    // vibrato.wet.value = 0.25
    
    const panner = new Tone.Panner(waveType === "triangle" ? 0.75 : -0.75)
    const gain2 = new Tone.Gain(1.5)
    const limiter = new Tone.Limiter(-1)
    const eq = new Tone.EQ3(-4, 0, -3)
    const eq2 = new Tone.EQ3(5, 1, 0)

    const supportsWebAudio = !!window.AudioContext || !!window.webkitAudioContext;
    console.log("🚀 ~ file: rect.js:101 ~ R3CT ~ supportsWebAudio:", supportsWebAudio)


    const cpuCores = navigator.hardwareConcurrency || "unknown";
    console.log("🚀 ~ file: rect.js:100 ~ R3CT ~ cpuCores:", cpuCores)
    if (cpuCores <= 2) {
      // Low-end device
    }
    const deviceMemory = navigator.deviceMemory || "unknown";
    console.log("🚀 ~ file: rect.js:101 ~ R3CT ~ deviceMemory:", deviceMemory)
    if (deviceMemory < 6) {
      // Low memory device
      this.fxChain = [
        // panner,
        // eq,
        // gain1,
        // compressor,
        // vibrato,
        // bitCrusher,
        // bdEq,
        // delay,
        // delEq,
        // compressor2,
        // eq2,
        // gain2,
        // limiter,
        Tone.Destination
      ]
    } else {
      this.fxChain = [
        panner,
        eq,
        gain1,
        compressor,
        vibrato,
        bitCrusher,
        bdEq,
        delay,
        delEq,
        compressor2,
        eq2,
        gain2,
        limiter,
        Tone.Destination
      ]
    }

    this.synth.chain(...this.fxChain)

    const seg1 = []
    const seg2 = []

    console.log("Rythm 1", R1)
    console.log("Rythm 2", R2)
    this.rhythms = {
      top: RHYTHMS[R1],
      right: RHYTHMS[R2],
      bottom: RHYTHMS[R1],
      left: RHYTHMS[R2]
    }
       
    this.horLen
    for (let x = x1; x <= x2; x += this.Xstep) {
      const v1 = createVector(x, y1)
      v1.segment = "top"
      seg1.push(v1)

      const xBot = x1 + x2 - x;
      const v3 = createVector(xBot, y2)
      v3.segment = "bottom"
      seg2.push(v3)
    }
    this.horLen = seg1.length
    this.vertLen = seg2.length

    for (let y = y1; y <= y2; y += this.Ystep) {
      const v2 = createVector(x2, y);
      v2.segment = "right"
      seg1.push(v2)

      const yLeft = y1 + y2 - y;
      const v4 = createVector(x1, yLeft)
      v4.segment = "left"
      seg2.push(v4)
    }
    
    this.borderPoints = seg1.concat(seg2)

    console.log("TOTAL LENGTH", this.borderPoints.length)
    // debug && 
    const quarter = floor(this.borderPoints.length / 4)
    for (let i = 0; i < rotateBy; i++) { 
      //rotate by quarters
      const quarterPoints = this.borderPoints.splice(0, quarter)
      this.borderPoints.push(...quarterPoints)
    }

    const fourthStart = floor(this.borderPoints.length / 4) * indexQuarterStart

    this.startIndex = startIndex !== undefined ? startIndex : fourthStart
  }

  replay() {
    this.complete = false;
    this.iterations = 0;
  }

  dispose() {
    console.log("Disposed")
    //skip destination as an fx
    for (let i = this.fxChain.length - 2; i >= 0; i--) { 
      const fx1 = this.fxChain[i]
      const fx2 = this.fxChain[i + 1]
      fx1.disconnect(fx2)
    }
    for (let i = this.fxChain.length - 2; i >= 0; i--) {
      this.fxChain[i].dispose()
      this.fxChain[i] = null
    }

    this.synth.dispose();
    this.synth = null
  }

  drawLine() {
    if (this.complete) return [];

    const len = this.borderPoints.length;


    let index = (this.startIndex + this.iterations) % len;

    if (this.reverse) index = len - index - 1

    const p = this.borderPoints[index]

    const side = p.segment


    const measureLength = this.measure / this.measureDiv
    const rhythm = this.rhythms[side]
    const reversedRhythm = this.rhythmReverse || this.reverse
    const volume = musicDebug ? 0.5 : rhythm(index, measureLength, reversedRhythm)

    //DRAW
    const step = min(this.Ystep, this.Xstep)

    const sw = max(step * 0.5, 0.5)//0.6

    this.buffer.strokeCap(SQUARE)

    const p1Index = floor(this.alterFunction(index) * this.factor) % len
    const p1 = debug ? createVector(width / 2, height / 2) : this.borderPoints[p1Index]

    const hModRange = 8
    const hMod = randomGaussian(0, hModRange)
    const h = hue(this.color) + hMod 
    const sModRange = 4
    const sMod = randomGaussian(0, sModRange)
    const s = saturation(this.color) + sMod
    const lModRange = 6
    const lMod = randomGaussian(0, lModRange)
    const l = lightness(this.color) + lMod
    const minAlpha = 0
    const maxAlpha = 0.7
    const a = map(volume, 0,1, minAlpha, maxAlpha)

    const modRangeTotal = hModRange + sModRange + lModRange
    const modTotal = hMod + sMod + lMod
    

    const getStep = (step) => {
      //alter length to make edge patterns
      const period = 200
      const phase = 0//PI*1.5
      const t = map(step, 0, len - 1, phase, TWO_PI * period + phase)
      switch (this.waveType) {
        case "sine": return sin(t);
        case "triangle": return tri(t);
      }
    }
    const edgeDepth = 0.01
    const edgeStep1 = map(getStep(index), -1, 1, 0, edgeDepth)
    const sinEdge1 = p5.Vector.lerp(p, p1, edgeStep1)
    const edgeStep2 = map(getStep(p1Index), -1, 1, 0, edgeDepth)
    const sinEdge2 = p5.Vector.lerp(p1, p, edgeStep2) 


    //PLAY Music

    //ref - https://pages.mtu.edu/~suits/NoteFreqCalcs.html
    const octaves = 1
    const maxStep = 12 * octaves
    const baseStep = floor(map(p.dist(p1), step*this.measure, this.maxDist, maxStep, 0, true))

    const scaleStep = ScaleStepMapping(baseStep, this.scale)
  // if (this.waveType === "triangle") console.log("🚀 ~ file: rect.js:201 ~ R3CT ~ drawLine ~ scaleStep:", scaleStep)
    const aConstant = 2 ** (1 / 12)
    let note = round((this.startingNote * (aConstant) ** scaleStep) * 1000) / 1000
    musicDebug && console.log("HERTZ", note)
    musicDebug && console.log("===========")

    note *= map(modTotal, -modRangeTotal, modRangeTotal, 0.993, 1.007)//modulation

    const volMod = withMusic ? 1 : 0.33

    //alt colors
    const isDorian = this.scale === "dorian"
    const isPhrygian = this.scale === "phrygian"
    const isLydian = this.scale === "lydian"
    const isMixolydian = this.scale === "mixolydian"
    const useAlt = () => {
      return false
      if (isDorian && scaleStep === 9) return true
      if (isPhrygian && scaleStep === 1) return true
      if (isLydian && scaleStep === 6) return true
      if (isMixolydian && scaleStep === 10) return true
    }
    const modS = useAlt() ? 90 : 0
    const modL = useAlt()
      ? (isDorian || isPhrygian) //have black bgs
        ? -30
        : 30
      : 0
    const col = color(h, s+modS, l+modL, a)
    this.buffer.strokeWeight(sw)
    this.buffer.stroke(col)
    this.buffer.line(sinEdge1.x, sinEdge1.y, sinEdge2.x, sinEdge2.y)


    const DECO_TYPE = this.decoType//"scattered-dots"//"straight-dots"//"scattered"//"straight

    const getDecoP = (point, pDist) => {
      switch (side) {
        case "top": return createVector(point.x, point.y - pDist)
        case "right": return createVector(point.x + pDist, point.y)
        case "bottom": return createVector(point.x, point.y + pDist)
        case "left": return createVector(point.x - pDist, point.y)
      }
    }
    const decAl = map(a, minAlpha, maxAlpha, minAlpha, maxAlpha/3)//2
    const decoCol = color(h, s+modS, l+modL, decAl)
    switch (DECO_TYPE) {
      case "straight-dots": { 
        const borderDist = sw * 8
        const dP = getDecoP(p, borderDist)
        

        this.borderBuffer.stroke(decoCol)
        this.borderBuffer.fill(decoCol)
        this.borderBuffer.rectMode(CENTER)
        this.borderBuffer.strokeCap(PROJECT)
        const minLen = sw*2
        const decorationRound = this.iterations % 2
        const useBit = (this.useBitcrusher && this.useDelay) ? decorationRound === 1 : this.useBitcrusher

        const pDist = minLen + minLen * (maxStep - scaleStep)
        const dP2 = getDecoP(dP, pDist)
        if (useBit) {
          this.borderBuffer.strokeWeight(sw)
          this.borderBuffer.line(dP.x, dP.y, dP2.x, dP2.y)
        }
        const useDel = (this.useBitcrusher && this.useDelay) ? decorationRound === 0 : this.useDelay
        if (useDel) {
          this.borderBuffer.noStroke()
          this.borderBuffer.circle(dP.x, dP.y, sw*1.75)
          this.borderBuffer.circle(dP2.x, dP2.y, sw*1.75)
          // for (let i = 0; i <= maxStep - scaleStep + 1; i++) { 
          //   const dP2 = getDecoP(dP, minLen * (i))
          //   this.borderBuffer.circle(dP2.x, dP2.y, minLen)
          // }
        }
        break;
      }
      case "scattered-dots": {
        const margDist = sw * 7
        const dp1 = getDecoP(p, margDist)
        const dp2 = getDecoP(p1, margDist)
        const dP = p5.Vector.lerp(dp1, dp2, -0.045)
        this.borderBuffer.stroke(col)
        this.borderBuffer.noFill(col)
        this.borderBuffer.rectMode(CENTER)
        const maxLen = sw * 3
        const decorationRound = this.iterations % 2
        const useBit = (this.useBitcrusher && this.useDelay) ? decorationRound === 1 : this.useBitcrusher
        if (useBit) {

          this.borderBuffer.push()
          this.borderBuffer.translate(dP.x, dP.y)
          this.borderBuffer.rotate(radians(45))
          this.borderBuffer.square(0, 0, maxLen)
          this.borderBuffer.pop()
        }
        const useDel = (this.useBitcrusher && this.useDelay) ? decorationRound === 0 : this.useDelay
        if (useDel) {
          const dP1 = getDecoP(dP, -maxLen)
          const dP2 = getDecoP(dP, maxLen)
          this.borderBuffer.line(dP1.x, dP1.y, dP2.x, dP2.y)
        }
        break;
      }
      case "straight": { 
        const maxDeco = 10//14
        const halfDeco = round(maxDeco/2)
        this.borderBuffer.rectMode(CENTER)
        this.borderBuffer.stroke(col)
        this.borderBuffer.noFill()
        
        const decorationRound = this.iterations % maxDeco
        const borderDist = sw * 14//30

        const decoP = getDecoP(p, borderDist)
        
        const maxLen = sw*8//10
        if (decorationRound === halfDeco && this.useBitcrusher) { 
          const isOff = this.iterations % round(maxDeco * 2) === halfDeco
          this.borderBuffer.square(decoP.x, decoP.y, maxLen)
          this.borderBuffer.push()
          this.borderBuffer.translate(decoP.x, decoP.y)
          if(isOff) this.borderBuffer.rotate(radians(45))
          this.borderBuffer.square(0, 0, maxLen / 2)
          this.borderBuffer.pop()
        }
        if (decorationRound === 0 && this.useDelay) { 
          

          const isOff = this.iterations % round(maxDeco * 2) === 0
          if (isOff) {
            this.borderBuffer.circle(decoP.x, decoP.y, maxLen)
            this.borderBuffer.circle(decoP.x, decoP.y, maxLen/4)
          } else {
            const decoP1 = getDecoP(decoP, -maxLen * 0.25)
            this.borderBuffer.circle(decoP1.x, decoP1.y, maxLen)
            const decoP2 = getDecoP(decoP, maxLen * 0.25)
            this.borderBuffer.circle(decoP2.x, decoP2.y, maxLen)
          }


        }
        break;
      }
      case "scattered": {
        const maxDeco = 4
        const halfDeco = round(maxDeco/2)
        const decoP = p5.Vector.lerp(p, p1, -0.04)
        const decorationRound = this.iterations % maxDeco
        this.borderBuffer.rectMode(CENTER)

        const maxLen = sw * 5
        this.borderBuffer.stroke(col)
        this.borderBuffer.noFill()
        if (decorationRound === halfDeco && this.useBitcrusher) {
          this.borderBuffer.push()
          this.borderBuffer.translate(decoP.x, decoP.y)
          this.borderBuffer.rotate(radians(45))
          this.borderBuffer.square(0, 0, maxLen*0.8)
          this.borderBuffer.pop()
        }
        if (decorationRound === 0 && this.useDelay) { 
          this.borderBuffer.circle(decoP.x, decoP.y, maxLen)
        }
        break;
      }
    }




    //END
    const endLen = this.halfStop ? floor(len * 0.5) : len;
    this.iterations++;

    const completed = this.iterations > endLen
    if (completed) {
      this.complete = true
      console.log("complete")
    }
    return [volume, note, volMod]
  }
  playNote(volume, note, volMod = 1) {
    if (!volume) return
    this.synth.triggerAttackRelease(note, "8n", undefined, volume * volMod);
  }
}

