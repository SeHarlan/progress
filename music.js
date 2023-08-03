function tri(t) {
  const p = TWO_PI
  const a = 1;
  return 4 * a / p * Math.abs((((t - p / 4) % p) + p) % p - p / 2) - a
}

const NoteHertz = {
  "C": [16.35, 32.70, 65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00, 4186.01],
  "Db": [17.32, 34.65, 69.30, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
  "D": [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.64],
  "Eb": [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
  "E": [20.60, 41.20, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
  "F": [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
  "Gb": [23.12, 46.25, 92.50, 185.00, 369.99, 739.99, 1479.98, 2959.96],
  "G": [24.50, 49.00, 98.00, 196.00, 392.00, 783.99, 1567.98, 3135.96],
  "Ab": [25.96, 51.91, 103.83, 207.65, 415.30, 830.61, 1661.22, 3322.44],
  "A": [27.50, 55.00, 110.00, 220.00, 440.00, 880.00, 1760.00, 3520.00],
  "Bb": [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
  "B": [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07]
}

const OctaveMap = (step, scaleFunctionCB) => {
  const octMult = floor(step / 12);
  const octaves = 12 * octMult;
  musicDebug && console.log("octaves", octaves)

  const baseStep = scaleFunctionCB(step % 12)
  musicDebug && console.log("baseStep", baseStep)
  return baseStep + octaves
}

const ScaleFunctionsMap = {
  pentatonic: (step) => {
    switch (step) {
      case 1: return 0;
      case 2: return 3;
      case 4: return 3;
      case 6: return 5;
      case 8: return 7;
      case 9: return 10;
      case 11: return 12;
      default: return step;
    }
  },
  major: (step) => {
    switch (step) {
      case 1: return 0;
      case 3: return 4;
      case 6: return 5;
      case 8: return 7;
      case 10: return 9;
      default: return step;
    }
  },
  minor: (step) => {
    switch (step) {
      case 1: return 0;
      case 4: return 3;
      case 6: return 5;
      case 9: return 8
      case 11: return 10;
      default: return step;
    }
  },
  // mixolydian: (step) => { 
  //   switch (step) {
  //     case 1: return 0;
  //     case 3: return 4;
  //     case 6: return 5;
  //     case 8: return 7;
  //     case 11: return 10;
  //     default: return step;
  //   }
  // },
  // lydian: (step) => {
  //   switch (step) {
  //     case 1: return 0;
  //     case 3: return 4;
  //     case 5: return 6;
  //     case 8: return 7;
  //     case 10: return 9;
  //     default: return step;
  //   }
  // },

}

const ScaleStepMapping = (step, scaleType) => {
  const scaleFunc = ScaleFunctionsMap[scaleType]
  const noteStep = OctaveMap(step, scaleFunc)
  musicDebug && console.log("noteStep", noteStep)
  return noteStep
}


//Rhythm
const getBaseNote = (t, measureLength, reversed) => { 
  if (reversed) return measureLength - (t % measureLength) - 1
  return t % measureLength
}
const getMod = (note, mod) => { 
  return note % round(mod) === 0
}
const RHYTHMS = {
  sin: (t, measureLength, reversed) => {
    let note = getBaseNote(t, measureLength, reversed)

    note = map(note, 0, measureLength, -PI/2, TWO_PI-PI/2)
    return map(sin(note), -1, 1, 0.1, 1, true)
  },
  square2: (t, measureLength, reversed) => {
    let note = getBaseNote(t, measureLength, reversed)
    const div = 2
    const onOff = floor(note / (measureLength / div)) % 2
    return map(onOff, 0, 1, 0.9, 0.1, true)
  },
  square4: (t, measureLength, reversed) => {
    let note = getBaseNote(t, measureLength, reversed)
    const div = 4
    const onOff = floor(note / (measureLength / div)) % 2
    return map(onOff, 0, 1, 0.9, 0.1, true)
  },
  fall: (t, measureLength, reversed) => {
    let note = getBaseNote(t, measureLength, reversed)
    return map(note, 0, measureLength, 1, 0)
  },
  alternate: (t, measureLength, reversed) => {
    const note = getBaseNote(t, measureLength, reversed) 
    return note % 2 === 0 ? 0.9 : 0.25
  },
  staggered: (t, measureLength, reversed) => { 
    const note = getBaseNote(t, measureLength, reversed) 
    if (note === 0) return 1
    if (getMod(note, measureLength/2)) return 0.8
    if (getMod(note, measureLength/4)) return 0.4
    return 0.1
  },
  stomp: (t, measureLength, reversed) => { 
    const note = getBaseNote(t, measureLength, reversed) 
    switch (note) { 
      case 0: return 1
      case 3: return 0.75
      case 6: return 1
      default: return 0.1
    }
  },
  anticipate: (t, measureLength, reversed) => {
    const note = getBaseNote(t, measureLength, reversed)
    switch (note) {
      case 0: return 1
      case 6: return 0.8
      case 14: return 0.5
      default: return 0.1
    }
  },
  anticipateFull: (t, measureLength, reversed) => {
    const note = getBaseNote(t, measureLength, reversed)
    switch (note) {
      case 0: return 1
      case 4: return 0.6
      case 8: return 1
      case 14: return 0.8
      case 15: return 0.4
      default: return 0.1
    }
  }
}