import { DEFAULT_VISUALIZER_CONFIG } from "../../config.js";

export const Bars =
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
