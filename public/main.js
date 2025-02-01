function createFrequencyVisualizer() {
  const canvas = document.getElementById("visualizer");

  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const draw = (data) => {
    // Clear the previous frame
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw bars
    const barWidth = (WIDTH / data.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      barHeight = data[i] * 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#00ff00");
      gradient.addColorStop(1, "#003300");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  };

  return {
    draw,
  };
}

/**
 * Creates a monitoring function for frequency data from an analyser node
 * @param {AnalyserNode} analyser - The Web Audio API analyser node to monitor
 * @returns {() => void} A function that when called logs the first 10 frequency data points
 */
function monitorFrequencyData(analyser, audioContext) {
  const frequencyData = createFrequencyData(analyser, audioContext);
  const visualizer = createFrequencyVisualizer();
  return () => {
    const data = frequencyData.current();
    visualizer.draw(data);
    const note = frequencyData.detectNote();
    if (note && note.note) {
      console.log(note?.note);
    }
  };
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

/**
 * Creates a wrapper around the frequency data array
 * @param {AnalyserNode} analyser - The Web Audio API analyser node to get data from
 * @returns {{current: () => Uint8Array}} An object with a method to get current frequency data
 */
function createFrequencyData(analyser, audioContext, scale = 0.5) {
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

/**
 * Initializes the Web Audio API components for audio visualization
 * @param {string} audioUrl - URL of the audio file to load
 * @returns {Promise<{analyser: AnalyserNode, source: AudioBufferSourceNode, context: AudioContext}>} The configured audio nodes
 */
async function initAudioVisualizer(audioUrl) {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  // Configure analyser for better visualization
  analyser.fftSize = 4096; // Increase FFT size for better frequency resolution
  analyser.smoothingTimeConstant = 0; // Smooths visualization
  // analyser.minDecibels = -90;
  // analyser.maxDecibels = -10;

  const response = await fetch(audioUrl);
  const data = await response.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(data);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  return {
    analyser,
    source,
    context: audioContext, // Return context for cleanup
  };
}

/**
 * Sets up an animation frame loop that calls the provided callback
 * @param {() => void} onFrame - Callback function to execute each animation frame
 * @returns {() => void} Cleanup function to stop the animation
 */
function getFrames(onFrame) {
  let running = true;

  const update = () => {
    if (!running) return;
    onFrame();
    requestAnimationFrame(update);
  };

  update();

  return () => {
    running = false;
  };
}

/**
 * Click handler for starting the audio visualization
 * @returns {Promise<void>}
 */
async function handleClick(e) {
  const groupName = this.getAttribute("data-notes-group");
  const noteFile = e.target.getAttribute("data-file");
  const button = e.target;
  button.disabled = true; // Prevent multiple clicks
  console.log("Playing " + e.target.innerText);
  try {
    const { source, analyser, context } = await initAudioVisualizer(
      `public/media/notes/${groupName}/${noteFile}`
    );

    source.start();

    const stop = getFrames(monitorFrequencyData(analyser, context));

    source.addEventListener("ended", () => {
      stop();
      context.close();
      button.disabled = false;
    });
  } catch (error) {
    console.error("Failed to initialize audio:", error);
    button.disabled = false;
  }
}

/**
 * Finds the index and value of the highest amplitude in frequency data
 * @param {Uint8Array} frequencyData - The frequency data array to analyze
 * @param {Object} options - Optional configuration
 * @param {number} options.threshold - Minimum amplitude to consider (0-255)
 * @returns {{maxIndex: number, maxValue: number}} The index and value of the peak
 */
function findPeakFrequency(frequencyData, { threshold = 0 } = {}) {
  let maxIndex = 0;
  let maxValue = 0;

  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > maxValue && frequencyData[i] >= threshold) {
      maxValue = frequencyData[i];
      maxIndex = i;
    }
  }

  return { maxIndex, maxValue };
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded successfully! 🚀");
  document.querySelectorAll(".notes-group").forEach((group) => {
    group.addEventListener("click", handleClick);
  });
});
