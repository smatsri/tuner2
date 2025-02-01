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

  let currentNote = null;

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

  const drawNote = ({ frequency, note, closeness }) => {
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`Note: ${note}`, 10, 20);
    ctx.fillText(`Closeness: ${closeness.toFixed(6)}`, 10, 40);
  };

  const draw = (data, note = null) => {
    // Clear the previous frame
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    //drawGrid();
    //drawBars(data);
    if (note && note.frequency > 0 && note.note && note.closeness > 0) {
      currentNote = note;
    }
    if (currentNote) {
      drawNote(currentNote);
    }
  };

  return {
    draw,
  };
}
