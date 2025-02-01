import { NOTE_FREQUENCIES } from "./audio-analyzer.js";
import { DEFAULT_VISUALIZER_CONFIG } from "./config.js";

export function createFrequencyVisualizer({
  gridColor,
  gridWidth,
  gridSpacing,
  barWidthMultiplier,
  barHeightMultiplier,
  barSpacing,
  gradientColors,
} = DEFAULT_VISUALIZER_CONFIG) {
  const canvas = document.getElementById("visualizer");

  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const drawGrid = () => {
    // Draw vertical grid lines
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = gridWidth;

    // Vertical lines
    for (let x = 0; x <= WIDTH; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
    }

    // Horizontal lines
    for (let y = 0; y <= HEIGHT; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
    }

    ctx.stroke();
  };

  const drawBars = (data) => {
    const barWidth = (WIDTH / data.length) * barWidthMultiplier;
    let barHeight;
    let x = 0;

    // Pre-calculate the gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, gradientColors.top);
    gradient.addColorStop(1, gradientColors.bottom);

    for (let i = 0; i < data.length; i++) {
      barHeight = data[i] * barHeightMultiplier;

      ctx.fillStyle = gradient;
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + barSpacing;
    }
  };

  const drawFrequency = (frequency) => {
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`Frequency: ${frequency}`, 10, 20);
  };

  // Linear interpolation function
  const lerp = (start, end, t) => start + (end - start) * t;

  let currentFrequency = null;

  const drawFrequencyRuler = (targetFrequency) => {
    const rulerHeight = 50;
    const rulerY = HEIGHT - rulerHeight;

    // Initialize currentFrequency if it's null
    if (currentFrequency === null) {
      currentFrequency = targetFrequency;
    }

    // Smoothly transition to the target frequency
    currentFrequency = lerp(currentFrequency, targetFrequency, 0.1);

    // Calculate the frequency range centered around the current frequency
    const minFreq = currentFrequency - 10;
    const maxFreq = currentFrequency + 10;

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
      ctx.fillText(note, x, rulerY - 20); // Positioned above the ruler
    });

    // Draw current frequency marker if available
    if (currentFrequency) {
      const markerX = (currentFrequency - minFreq) * pixelsPerHz;

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
      ctx.fillText(`${Math.round(currentFrequency)} Hz`, markerX, rulerY - 45); // Moved higher to avoid overlap
    }
  };

  const draw = (data, note = null) => {
    // Clear the previous frame
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw the grid first (background)
    //drawGrid();

    // Draw the frequency bars on top
    //drawBars(data);

    // Draw the frequency ruler at the bottom
    drawFrequencyRuler(note?.frequency);

    // Update current note if provided
  };

  return {
    draw,
  };
}
