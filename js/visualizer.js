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

  const drawFrequencyRuler = (frequency) => {
    const rulerHeight = 50;
    const rulerY = HEIGHT - rulerHeight;
    const minFreq = 20; // Minimum audible frequency
    const maxFreq = 2000; // Maximum frequency to display

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

    // Calculate pixels per Hz for scaling
    const pixelsPerHz = WIDTH / (maxFreq - minFreq);

    // Draw major ticks every 100 Hz
    for (let freq = 0; freq <= maxFreq; freq += 100) {
      const x = (freq - minFreq) * pixelsPerHz;

      // Draw major tick
      ctx.beginPath();
      ctx.moveTo(x, rulerY);
      ctx.lineTo(x, rulerY + 15);
      ctx.stroke();

      // Add label
      ctx.fillText(freq.toString(), x, rulerY + 30);
    }

    // Draw minor ticks every 20 Hz
    for (let freq = 0; freq <= maxFreq; freq += 20) {
      const x = (freq - minFreq) * pixelsPerHz;

      ctx.beginPath();
      ctx.moveTo(x, rulerY);
      ctx.lineTo(x, rulerY + 8);
      ctx.stroke();
    }

    // Draw current frequency marker if available
    if (frequency) {
      const markerX = (frequency - minFreq) * pixelsPerHz;

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
      ctx.fillText(`${Math.round(frequency)} Hz`, markerX, rulerY - 25);
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
