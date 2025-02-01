import {
  DEFAULT_GLOBK,
  DEFAULT_SCALE,
  DEFAULT_DETECT_CONFIG,
} from "./config.js";

export const NOTE_FREQUENCIES = {
  D2: 73.42,
  Eb2: 77.78,
  E2: 82.41,
  G2: 98.0,
  A2: 110.0,
  Ab2: 103.83,
  Bb2: 116.54,
  Db3: 138.59,
  D3: 146.83,
  Gb3: 185.0,
  G3: 196.0,
  Bb3: 233.08,
  B3: 246.94,
  Db4: 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
};

export function detectNote(
  analyser,
  audioContext,
  globk = DEFAULT_GLOBK,
  config = DEFAULT_DETECT_CONFIG
) {
  const bitCounter = audioContext.sampleRate;
  // Convert frequency data to time domain data for findWaveLength
  const timeDomainData = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(timeDomainData);

  const frequency =
    bitCounter /
    findWaveLength(
      timeDomainData,
      config.minPeriod,
      config.maxPeriod,
      config.peakThreshold,
      config.maxPeaks,
      config.amplitudeThreshold,
      Math.ceil(config.interpolationFactor / globk)
    );

  if (frequency > 0) {
    const note = getNote(frequency, config.noteMatchThreshold);

    return {
      frequency,
      note: note?.note,
      neighborNote: note?.neighborNote,
      closeness: note?.closeness || 0,
    };
  }

  return {
    frequency: 0,
    note: null,
    neighborNote: null,
    closeness: 0,
  };
}

export function getFrequencyData(
  analyser,
  frequencyData,
  scale = DEFAULT_SCALE
) {
  analyser.getByteFrequencyData(frequencyData);
  return Array.from(frequencyData).map((value) => value * scale);
}

function findWaveLength(
  signalArray,
  minPeriod,
  maxPeriod,
  peakThreshold,
  maxPeaks,
  amplitudeThreshold,
  interpolationFactor
) {
  let interpolatedSignal = [];
  for (let i = 0; i < signalArray.length - 1; i++) {
    interpolatedSignal.push(signalArray[i]);
    for (let j = 1; j < interpolationFactor; j++) {
      interpolatedSignal.push(
        signalArray[i] +
          ((signalArray[i + 1] - signalArray[i]) * j) / interpolationFactor
      );
    }
  }
  interpolatedSignal.push(signalArray[signalArray.length - 1]);

  minPeriod *= interpolationFactor;
  maxPeriod *= interpolationFactor;

  let maxAmplitude = 0,
    peakIndex = 0,
    totalAmplitude = 0;
  for (let j = 0; j < maxPeriod; j++) {
    if (Math.abs(interpolatedSignal[j]) > maxAmplitude) {
      peakIndex = j;
      maxAmplitude = Math.abs(interpolatedSignal[j]);
    }
    totalAmplitude += Math.abs(interpolatedSignal[j]);
  }

  if (
    amplitudeThreshold > totalAmplitude / maxPeriod ||
    peakIndex === 0 ||
    peakIndex === maxPeriod
  )
    return -1;

  let bestFrequency = 0,
    bestPeriod = 0,
    minFrequency = Infinity,
    minPeriodResult = 0;
  for (let j = minPeriod; j <= maxPeriod; j++) {
    let sum = 0,
      count = 0,
      weightedSum = 0,
      peakCount = 0;
    for (let k = peakIndex; k < interpolatedSignal.length; k += j) {
      sum += interpolatedSignal[k];
      if (
        count !== 0 &&
        k < interpolatedSignal.length - 5 * interpolationFactor
      ) {
        let ratio = interpolatedSignal[k] / interpolatedSignal[peakIndex];
        if (ratio > 0) {
          ratio = Math.min(ratio, 1);
          let current = interpolatedSignal[k],
            prev = interpolatedSignal[k - 5 * interpolationFactor],
            next = interpolatedSignal[k + 5 * interpolationFactor];
          if (
            interpolatedSignal[peakIndex] >= 0
              ? current > next && current > prev
              : next > current && prev > current
          ) {
            weightedSum +=
              (ratio ** 4 *
                interpolatedSignal[peakIndex] *
                peakThreshold *
                (maxPeriod - j)) /
              maxPeriod;
            peakCount++;
          }
        }
      }
      count++;
      if (count >= maxPeaks) break;
    }
    sum += (weightedSum * peakCount) / count;
    sum /= count;
    if (sum > bestFrequency) {
      bestFrequency = sum;
      bestPeriod = j;
    } else if (sum < minFrequency) {
      minFrequency = sum;
      minPeriodResult = j;
    }
  }
  return interpolatedSignal[peakIndex] >= 0
    ? bestPeriod / interpolationFactor
    : minPeriodResult / interpolationFactor;
}

const getNote = (frequency, matchThreshold) => {
  let closestNote = null;
  let secondClosestNote = null;
  let closestDiff = Infinity;
  let secondClosestDiff = Infinity;
  const noteFrequencies = NOTE_FREQUENCIES;

  for (const [note, freq] of Object.entries(noteFrequencies)) {
    const diff = Math.abs(frequency - freq);
    if (diff < closestDiff) {
      secondClosestDiff = closestDiff;
      secondClosestNote = closestNote;
      closestDiff = diff;
      closestNote = note;
    } else if (diff < secondClosestDiff) {
      secondClosestDiff = diff;
      secondClosestNote = note;
    }
  }

  const percentDiff = closestDiff / noteFrequencies[closestNote];
  if (percentDiff <= matchThreshold) {
    const closeness = (1 - percentDiff) * 100;
    return {
      note: closestNote,
      neighborNote: secondClosestNote,
      closeness:
        frequency < noteFrequencies[closestNote] ? -closeness : closeness,
    };
  }
  return null;
};
