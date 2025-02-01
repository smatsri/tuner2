export function findWaveLength(
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

export function createFrequencyData(analyser, audioContext, scale = 0.5) {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  const getNoteName = (frequency) => {
    const noteFrequencies = {
      E2: 82.41,
      A2: 110.0,
      D3: 146.83,
      G3: 196.0,
      B3: 246.94,
      E4: 329.63,
    };

    let closestNote = null;
    let closestDiff = Infinity;

    for (const [note, freq] of Object.entries(noteFrequencies)) {
      const diff = Math.abs(frequency - freq);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestNote = note;
      }
    }

    const percentDiff = closestDiff / noteFrequencies[closestNote];
    if (percentDiff <= 0.15) {
      return closestNote;
    }
    return null;
  };

  return {
    current: () => {
      analyser.getByteFrequencyData(frequencyData);
      return Array.from(frequencyData).map((value) => value * scale);
    },

    detectNote: () => {
      const bitCounter = audioContext.sampleRate;
      // Convert frequency data to time domain data for findWaveLength
      const timeDomainData = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(timeDomainData);

      const frequency =
        bitCounter /
        findWaveLength(
          timeDomainData,
          24, // Adjust these parameters as needed
          1200,
          10,
          10,
          0.016,
          Math.ceil(10 / 1) // Assuming globk is 1 for simplicity
        );

      if (frequency > 0) {
        const noteName = getNoteName(frequency);

        return {
          frequency: Math.round(frequency),
          note: noteName,
        };
      }

      return null;
    },
  };
}
