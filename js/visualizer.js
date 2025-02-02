import { NOTE_FREQUENCIES } from "./audio-analyzer.js";
import { DEFAULT_VISUALIZER_CONFIG } from "./config.js";

const Grid =
  ({
    color = DEFAULT_VISUALIZER_CONFIG.gridColor,
    width = DEFAULT_VISUALIZER_CONFIG.gridWidth,
    spacing = DEFAULT_VISUALIZER_CONFIG.gridSpacing,
  }) =>
  (ctx, canvas) => {
    // Draw vertical grid lines
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }

    ctx.stroke();
  };

const Bars =
  ({
    data,
    barWidthMultiplier = 1,
    barHeightMultiplier = 1,
    barSpacing = DEFAULT_VISUALIZER_CONFIG.barSpacing,
    gradientColors = DEFAULT_VISUALIZER_CONFIG.gradientColors,
  }) =>
  (ctx, canvas) => {
    const barWidth = (canvas.width / data.length) * barWidthMultiplier;
    let barHeight;
    let x = 0;

    // Pre-calculate the gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, gradientColors.top);
    gradient.addColorStop(1, gradientColors.bottom);

    for (let i = 0; i < data.length; i++) {
      barHeight = data[i] * barHeightMultiplier;

      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + barSpacing;
    }
  };

// Linear interpolation function
const lerp = (start, end, t) => start + (end - start) * t;

const FrequencyRuler =
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
      ctx.fillText(note, x, rulerY - 20); // Positioned above the ruler
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
      ); // Moved higher to avoid overlap
    }
  };

const Layout = () => (ctx, canvas) => {
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();
};

const render = (view, ctx, canvas, state = {}) => {
  view.forEach(([component, children]) => {
    component(ctx, canvas, state);

    if (children) {
      children.forEach((child) => {
        if (Array.isArray(child)) {
          render(child, ctx, canvas, state);
        } else {
          child(ctx, canvas, state);
        }
      });
    }
  });
};

const View = ({ targetFrequency, data }) => [
  [
    Layout,
    [
      Grid({}),
      // Bars({
      //   data,
      // }),
      FrequencyRuler({ targetFrequency }),
    ],
  ],
];

export function createFrequencyVisualizer() {
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const state = { currentFrequency: null };

  const draw = (data, note = null) => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    render(
      View({ targetFrequency: note?.frequency, data }),
      ctx,
      canvas,
      state
    );
  };

  return {
    draw,
  };
}
