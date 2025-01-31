/**
 * Creates a monitoring function for frequency data from an analyser node
 * @param {AnalyserNode} analyser - The Web Audio API analyser node to monitor
 * @returns {() => void} A function that when called logs the first 10 frequency data points
 */
function monitorFrequencyData(analyser) {
  const frequencyData = createFrequencyData(analyser);

  return () => {
    const data = frequencyData.current();
    console.log(data.slice(0, 10));
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
async function handleClick() {
  const button = document.querySelector("#startAudio");
  button.disabled = true; // Prevent multiple clicks

  try {
    const { source, analyser, context } = await initAudioVisualizer(
      "public/media/notes/base/E2.mp3"
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

// Sets up event listeners when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded successfully! 🚀");
  document.querySelector("#startAudio").addEventListener("click", handleClick);
});
