// Move button handler inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded successfully! 🚀");

  // Add button click handler
  document.querySelector("#startAudio").addEventListener("click", () => {
    initAudioVisualizer("public/media/notes/base/E2.mp3")
      .then((visualizer) => {
        console.log("Audio visualizer initialized!");
      })
      .catch((error) => {
        console.error("Error initializing audio visualizer:", error);
      });
  });
});

function initAudioVisualizer(audioUrl) {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();

  return fetch(audioUrl)
    .then((response) => response.arrayBuffer())
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.start();

      // Frequency Data
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      function update() {
        analyser.getByteFrequencyData(frequencyData);
        //console.log(frequencyData);
        // requestAnimationFrame(update);
      }
      update();

      return {
        analyser,
        source,
        frequencyData,
      };
    });
}
