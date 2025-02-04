import { DEFAULT_VISUALIZER_CONFIG } from "../../config.js";

export const Grid =
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
