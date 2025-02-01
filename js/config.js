// Default global constant for wave detection interpolation adjustment
export const DEFAULT_GLOBK = 1;

// Default scaling factor for frequency data visualization
export const DEFAULT_SCALE = 0.5;

// Default color for visualization bars (unused)
export const DEFAULT_BAR_COLOR = "rgba(255, 255, 255, 0.5)";

// Configuration for the frequency visualizer
export const DEFAULT_VISUALIZER_CONFIG = {
  // Grid appearance
  gridColor: "rgba(0, 0, 0, 0.2)", // Color of the background grid
  gridWidth: 0.5, // Width of grid lines in pixels
  gridSpacing: 20, // Spacing between grid lines in pixels

  // Frequency bar appearance
  barWidthMultiplier: 8, // Controls how wide the bars are relative to data
  barHeightMultiplier: 1.5, // Controls how tall the bars are
  barSpacing: 1, // Space between bars in pixels

  // Gradient colors for the frequency bars
  gradientColors: {
    top: "#00ff00", // Color at the top of each bar
    bottom: "#003300", // Color at the bottom of each bar
  },
};

// Configuration for audio frequency detection and note analysis
export const DEFAULT_DETECT_CONFIG = {
  // Wave detection parameters
  minPeriod: 24, // Minimum period to consider for wave detection
  maxPeriod: 1200, // Maximum period to consider for wave detection
  peakThreshold: 10, // Threshold for peak detection sensitivity
  maxPeaks: 10, // Maximum number of peaks to analyze
  amplitudeThreshold: 0.016, // Minimum amplitude to consider for wave detection
  interpolationFactor: 10, // Interpolation factor for wave analysis (divided by globk)
  // Maximum allowed difference between detected and true frequency (as percentage)
  noteMatchThreshold: 0.15, // 15% tolerance for note matching
};
