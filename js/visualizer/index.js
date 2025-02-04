import { render, View } from "./view.js";

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
