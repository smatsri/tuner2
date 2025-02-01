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
function monitorFrequencyData(analyser) {
  const frequencyData = createFrequencyData(analyser);
  const visualizer = createFrequencyVisualizer();
  return () => {
    const data = frequencyData.current();
    visualizer.draw(data);
  };
}

/**
 * Creates a wrapper around the frequency data array
 * @param {AnalyserNode} analyser - The Web Audio API analyser node to get data from
 * @returns {{current: () => Uint8Array}} An object with a method to get current frequency data
 */
function createFrequencyData(analyser) {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  return {
    current: () => {
      analyser.getByteFrequencyData(frequencyData);
      return frequencyData;
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
  analyser.fftSize = 2048; // Allows for more detailed frequency data
  analyser.smoothingTimeConstant = 0.8; // Smooths visualization
  analyser.minDecibels = -90;
  analyser.maxDecibels = 100;

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

  try {
    const { source, analyser, context } = await initAudioVisualizer(
      `public/media/notes/${groupName}/${noteFile}`
    );

    source.start();

    const stop = getFrames(monitorFrequencyData(analyser));

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
