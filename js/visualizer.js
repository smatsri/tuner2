export function createFrequencyVisualizer() {
  const canvas = document.getElementById("visualizer");

  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const gridColor = "rgba(0, 0, 0, 0.2)";
  const gridWidth = 0.5;
  const gridSpacing = 20;
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
    const barWidth = (WIDTH / data.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      barHeight = data[i] * 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#00ff00");
      gradient.addColorStop(1, "#003300");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  };

  const draw = (data) => {
    // Clear the previous frame
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawGrid();
    drawBars(data);
  };

  return {
    draw,
  };
}
