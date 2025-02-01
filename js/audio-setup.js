import { createFrequencyData } from "./audio-analyzer.js";
import { createFrequencyVisualizer } from "./visualizer.js";

export function monitorFrequencyData(analyser, audioContext) {
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

export async function initAudioVisualizer(audioUrl) {
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
