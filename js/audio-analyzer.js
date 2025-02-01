import {
  DEFAULT_GLOBK,
  DEFAULT_SCALE,
  DEFAULT_DETECT_CONFIG,
} from "./config.js";

const tunings = {
  standard: {
    E2: 82.41, // Low E string
    A2: 110.0, // A string
    D3: 146.83, // D string
    G3: 196.0, // G string
    B3: 246.94, // B string
    E4: 329.63, // High E string
  },
  dropD: {
    D2: 73.42, // Low D string (instead of E2)
    A2: 110.0, // A string
    D3: 146.83, // D string
    G3: 196.0, // G string
    B3: 246.94, // B string
    E4: 329.63, // High E string
  },
  // Add more tunings as needed
  halfStepDown: {
    Eb2: 77.78, // Low Eb string
    Ab2: 103.83, // Ab string
    Db3: 138.59, // Db string
    Gb3: 185.0, // Gb string
    Bb3: 233.08, // Bb string
    Eb4: 311.13, // High Eb string
  },
  // Example: Open G tuning
  openG: {
    D2: 73.42, // Low D string
    G2: 98.0, // G string
    D3: 146.83, // D string
    G3: 196.0, // G string
    B3: 246.94, // B string
    D4: 293.66, // High D string
  },
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
    const noteName = getNoteName(
      frequency,
      config.tuning,
      config.noteMatchThreshold
    );

    return {
      frequency: Math.round(frequency),
      note: noteName,
    };
  }

  return null;
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

const getNoteName = (frequency, tuningName, matchThreshold) => {
  let closestNote = null;
  let closestDiff = Infinity;
  const noteFrequencies = tunings[tuningName];
  if (!noteFrequencies) {
    return null;
  }

  for (const [note, freq] of Object.entries(noteFrequencies)) {
    const diff = Math.abs(frequency - freq);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestNote = note;
    }
  }

  const percentDiff = closestDiff / noteFrequencies[closestNote];
  if (percentDiff <= matchThreshold) {
    return closestNote;
  }
  return null;
};
