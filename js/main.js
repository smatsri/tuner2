import { initAudioVisualizer } from "./audio-setup.js";
import { getFrames } from "./animation.js";
import { monitorFrequencyData } from "./audio-setup.js";

async function handleClick(e) {
  const groupName = this.getAttribute("data-notes-group");
  const noteFile = e.target.getAttribute("data-file");
  const button = e.target;
  button.disabled = true; // Prevent multiple clicks
  console.log("Playing " + e.target.innerText);
  try {
    const { source, analyser, context } = await initAudioVisualizer(
      `public/media/notes/${groupName}/${noteFile}`
    );

    source.start();

    const stop = getFrames(monitorFrequencyData(analyser, context));

    source.addEventListener("ended", () => {
      stop();
      context.close();
      button.disabled = false;
    });
  } catch (error) {
    console.error("Failed to initialize audio:", error);
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded successfully! 🚀");
  document.querySelectorAll(".notes-group").forEach((group) => {
    group.addEventListener("click", handleClick);
  });
});
