// DOM Elements
const container = document.querySelector(".container");
const heading = document.querySelector("h1");

// Example function to demonstrate DOM manipulation
function updateHeading() {
  heading.style.color = "#2c3e50";
  heading.textContent = "Welcome! 👋";
}

// Example event listener
heading.addEventListener("click", updateHeading);

// Add a simple console message when the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded successfully! 🚀");
});
