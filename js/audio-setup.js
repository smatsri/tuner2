import { detectNote, getFrequencyData } from "./audio-analyzer.js";
import { DEFAULT_GLOBK } from "./config.js";
import { createFrequencyVisualizer } from "./visualizer/index.js";

export function monitorFrequencyData(analyser, audioContext) {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  const visualizer = createFrequencyVisualizer();
  return () => {
    const data = getFrequencyData(analyser, frequencyData);

    const noteData = detectNote(analyser, audioContext);
    if (noteData && noteData.note) {
      console.log(noteData?.note, noteData?.closeness);
    }

    visualizer.draw(data, noteData);
  };
}

export async function initAudioVisualizer(audioUrl, globk = DEFAULT_GLOBK) {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  // Configure analyser for better visualization
  analyser.fftSize = 4096 * globk; // Increase FFT size for better frequency resolution
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
