function monitorFrequencyData(analyser) {
  const frequencyData = FrequencyData(analyser);

  return () => {
    const data = frequencyData.current();
    console.log(data.slice(0, 10));
  };
}

function FrequencyData(analyser) {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);

  return {
    current: () => {
      analyser.getByteFrequencyData(frequencyData);
      return frequencyData;
    },
  };
}

async function initAudioVisualizer(audioUrl) {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();

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
  };
}

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

// Move button handler inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded successfully! 🚀");
  document.querySelector("#startAudio").addEventListener("click", handleClick);
});

async function handleClick() {
  const { source, analyser } = await initAudioVisualizer(
    "public/media/notes/base/E2.mp3"
  );
  source.start();

  const stop = getFrames(monitorFrequencyData(analyser));

  source.addEventListener("ended", stop);
}
