class R3CT {
  constructor(
    { x1, y1, x2, y2, measure, factor, alterFunction, color, startIndex, halfStop, buffer, reverse, rotateBy, indexQuarterStart },
    { startingNote = 220, //220hz (A3) as lowest note
      scale = "pentatonic",
      waveType = random(['sine', 'triangle']),
      R1 = random(Object.keys(RHYTHMS)),
      R2 = random(Object.keys(RHYTHMS)),
      rhythmReverse = random([true, false]),
    }
  ) {
    this.buffer = buffer

    this.reverse = reverse
    this.rhythmReverse = rhythmReverse

    console.log("Rhythm Reversed:", rhythmReverse)

    this.complete = false;
    this.borderPoints = [];
    this.itterations = 0;

    this.waveType = waveType

    this.maxDist = dist(x1, y1, x2, y2)

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

    // const comp = new Tone.Compressor(-100, 10)
    this.synth = new Tone.Synth({
      oscillator: {
        type: this.waveType
      }
    }).toDestination();


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
       
    for (let x = x1; x < x2; x += this.Xstep) {
      const v1 = createVector(x, y1)
      v1.segment = "top"
      seg1.push(v1)

      const xBot = x1 + x2 - x;
      const v3 = createVector(xBot, y2)
      v3.segment = "bottom"
      seg2.push(v3)
    }

    for (let y = y1; y < y2; y += this.Ystep) {
      const v2 = createVector(x2, y);
      v2.segment = "right"
      seg1.push(v2)

      const yLeft = y1 + y2 - y;
      const v4 = createVector(x1, yLeft)
      v4.segment = "left"
      seg2.push(v4)
    }
    
    this.borderPoints = seg1.concat(seg2)

    debug && console.log("TOTAL LENGTH", this.borderPoints.length)

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
    this.itterations = 0;
  }

  dispose() {
    console.log("Disposed")
    this.synth.dispose();
  }

  drawLine() {
    if (this.complete) return;

    const len = this.borderPoints.length;


    let index = (this.startIndex + this.itterations) % len;

    if (this.reverse) index = len - index - 1

    const p = this.borderPoints[index]


    const measureLength = this.measure / this.measureDiv
    const rhythm = this.rhythms[p.segment]
    const reversedRhythm = this.rhythmReverse || this.reverse
    const volume = musicDebug ? 0.5 : rhythm(index, measureLength, reversedRhythm)

    //DRAW
    const step = min(this.Ystep, this.Xstep)

    const sw = max(step * 0.5, 0.5)//0.6


    this.buffer.strokeWeight(sw)
    this.buffer.strokeCap(SQUARE)

    const p1Index = floor(this.alterFunction(index) * this.factor) % len
    const p1 = debug ? createVector(width / 2, height / 2) : this.borderPoints[p1Index]

    const modRange = 8
    const hMod = randomGaussian(0, modRange)
    const h = hue(this.color) + hMod 
    const sMod = randomGaussian(0, modRange)
    const s = saturation(this.color) + sMod
    const lMod = randomGaussian(0, modRange)
    const l = lightness(this.color) + lMod
    const a = map(volume, 0,1, 0, 0.75)//alpha(this.color)

    const modTotal = hMod + sMod + lMod

    this.buffer.stroke(h, s, l, a)

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
    this.buffer.line(sinEdge1.x, sinEdge1.y, sinEdge2.x, sinEdge2.y)
    


    //PLAY Music
    // if (withMusic) {
      //ref - https://pages.mtu.edu/~suits/NoteFreqCalcs.html
      const octaves = 3
      const baseStep = floor(map(p.dist(p1), step * 2, this.maxDist - step, (octaves*12), 0, true))
      const scaleStep = ScaleStepMapping(baseStep, this.scale)
      const aConstant = 2 ** (1 / 12)
      let note = round((this.startingNote * (aConstant) ** scaleStep) * 1000) / 1000
      musicDebug && console.log("HERTZ", note)
      musicDebug && console.log("===========")

      const modRangeTotal = modRange*3
      note *= map(modTotal, -modRangeTotal, modRangeTotal, 0.993, 1.007)//modulation

      const volMod = withMusic ? 1 : 0.33

      volume && (this.synth.triggerAttackRelease(note, "8n", undefined, volume* volMod));
    // }


    //END
    const endLen = this.halfStop ? floor(len * 0.5) : len;
    this.itterations++;

    const completed = this.itterations > endLen
    if (completed) {
      this.complete = true
      console.log("complete")
    }
  }
}

