import { NOTE_FREQUENCIES } from "../../audio-analyzer.js";

// Linear interpolation function
const lerp = (start, end, t) => start + (end - start) * t;

export const FrequencyRuler =
  ({ targetFrequency }) =>
  (ctx, canvas, state) => {
    const HEIGHT = canvas.height;
    const WIDTH = canvas.width;
    const rulerHeight = 50;
    const rulerY = HEIGHT - rulerHeight;

    // Initialize currentFrequency if it's null
    if (state.currentFrequency === null) {
      state.currentFrequency = targetFrequency;
    }

    // Smoothly transition to the target frequency
    state.currentFrequency = lerp(state.currentFrequency, targetFrequency, 0.1);

    // Calculate the frequency range centered around the current frequency
    const minFreq = state.currentFrequency - 10;
    const maxFreq = state.currentFrequency + 10;

    // Calculate pixels per Hz for scaling
    const pixelsPerHz = WIDTH / (maxFreq - minFreq);

    // Draw ruler base line
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.moveTo(0, rulerY);
    ctx.lineTo(WIDTH, rulerY);
    ctx.stroke();

    // Draw ticks and labels
    ctx.font = "12px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";

    // Draw major ticks every 2 Hz
    for (let freq = minFreq; freq <= maxFreq; freq += 2) {
      const x = (freq - minFreq) * pixelsPerHz;

      // Draw major tick
      ctx.beginPath();
      ctx.moveTo(x, rulerY);
      ctx.lineTo(x, rulerY + 15);
      ctx.stroke();

      // Add frequency label
      ctx.fillText(freq.toFixed(0), x, rulerY + 30);
    }

    // Draw note labels at their frequencies
    Object.entries(NOTE_FREQUENCIES).forEach(([note, freq]) => {
      const x = (freq - minFreq) * pixelsPerHz;

      // Text settings
      ctx.font = "12px Arial";
      ctx.textAlign = "center";

      // Draw note name above the ruler
      ctx.fillStyle = "blue";
      ctx.fillText(note, x, rulerY - 20);
    });

    // Draw current frequency marker if available
    if (state.currentFrequency) {
      const markerX = (state.currentFrequency - minFreq) * pixelsPerHz;

      // Draw triangle pointer
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.moveTo(markerX, rulerY - 10);
      ctx.lineTo(markerX - 8, rulerY - 20);
      ctx.lineTo(markerX + 8, rulerY - 20);
      ctx.closePath();
      ctx.fill();

      // Draw frequency text
      ctx.font = "14px Arial";
      ctx.fillStyle = "red";
      ctx.fillText(
        `${Math.round(state.currentFrequency)} Hz`,
        markerX,
        rulerY - 45
      );
    }
  };
