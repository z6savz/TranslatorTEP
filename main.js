import { initGL } from './glProcessor.js';

// DOM elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const redGain = document.getElementById("redGain");
const greenGain = document.getElementById("greenGain");
const blueGain = document.getElementById("blueGain");
const contrast = document.getElementById("contrast");
const textCanvas = document.getElementById("textCanvas");
const textOutput = document.getElementById("textOutput");
const videoUpload = document.getElementById("videoUpload");
const replayBtn = document.getElementById("replayBtn");
const loadingDiv = document.getElementById("loadingDiv");
const lsbChannel = document.getElementById("lsbChannel");

let glContext = null; // WebGL context wrapper for video processing
//let lsbOutputText = "";    // Stores LSB output for download


// Video upload handler
videoUpload.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  video.src = url;
  video.load();
  video.onloadeddata = () => {
    //setup canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    glContext = initGL(canvas); // Initialize WebGL context
    video.pause();  // Pause to control frame processing

    // Enable controls for user adjustment
    [redGain, greenGain, blueGain, contrast, lsbChannel].forEach(ctrl => ctrl.disabled = false);
    document.getElementById("startAnalysisBtn").disabled = false;
  };

  // Safely disable controls
  [redGain, greenGain, blueGain, contrast].forEach(ctrl => {
    if (ctrl) ctrl.disabled = true;
  });
});

// Start Analysis button handler
const startAnalysisBtn = document.getElementById("startAnalysisBtn");
startAnalysisBtn.addEventListener("click", async () => {
  startAnalysisBtn.disabled = true; // Prevent double-trigger
  await processVideoFrames();
});

// Helper to seek video and wait for frame
function seekTo(time) {
  return new Promise(resolve => {
    function handler() {
      video.removeEventListener('seeked', handler);
      // Wait a short moment to ensure frame is updated
      setTimeout(resolve, 100); // 100ms delay
    }
    video.addEventListener('seeked', handler);
    video.currentTime = time;
    video.play();
  });
}

// Replay button handler
replayBtn.addEventListener("click", async () => {
  video.currentTime = 0; // Reset to start
  video.pause(); // Ensure paused
  textOutput.textContent = ""; // Clear previous output
  await processVideoFrames(); // Re-process frames
});

// LSB extraction logic
//function getLSBBits(imageData, channel) {
  // extract LSBs from specified channel(s)
  //const data = imageData.data;
  //const width = imageData.width;
  //let result = "";

  //if (channel === "all") {
    // Extract from all channels
    //let redBits = "", greenBits = "", blueBits = "";
    //for (let i = 0; i < data.length; i += 4) {
      //redBits   += (data[i]   & 1);
      //greenBits += (data[i+1] & 1);
      //blueBits  += (data[i+2] & 1);
      //if (((i / 4 + 1) % width) === 0) {
      //  redBits   += "\n";
      //  greenBits += "\n";
      //  blueBits  += "\n";
      //}
    //}
    //result += "Red LSB:\n"   + redBits + "\n";
    //result += "Green LSB:\n" + greenBits + "\n";
    //result += "Blue LSB:\n"  + blueBits + "\n";
  //} else {
    // Extract from single channel
    //let bits = "";
    //let offset = channel === "red" ? 0 : channel === "green" ? 1 : 2;
    //for (let i = 0; i < data.length; i += 4) {
      //bits += (data[i + offset] & 1);
      //if (((i / 4 + 1) % width) === 0) bits += "\n";
    //}
    //result = `${channel.charAt(0).toUpperCase() + channel.slice(1)} LSB:\n${bits}\n`;
  //}
  //return result;
//}

// Main frame processing logic
async function processVideoFrames() {
  // Show loading indicator and disable controls
  const loadingText = document.getElementById("loadingText");
  if (loadingDiv) loadingDiv.style.display = 'block';
  [redGain, greenGain, blueGain, contrast].forEach(ctrl => ctrl.disabled = true);

  // Temporary canvas for OCR
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;
  const tempCtx = tempCanvas.getContext('2d');

  const step = 1.37; // seconds between frames
  textOutput.textContent = "";
  //lsbOutputText = ""; // Reset before processing

  // Loop through video frames
  for (let t = 0; t < video.duration; t += step) {
    await seekTo(t);

    // Get current color/contrast settings
    const gain = [
      parseFloat(redGain.value),
      parseFloat(greenGain.value),
      parseFloat(blueGain.value)
    ];
    const contrastVal = parseFloat(contrast.value);

    // Render frame with WebGL processing
    glContext.renderFrame(video, gain, contrastVal);

    // Extract image data for OCR and LSB
    const imageData = glContext.extractImageData();
    tempCtx.putImageData(imageData, 0, 0);

    // OCR using Tesseract.js
    let text = "";
    try {
      const ocrResult = await Tesseract.recognize(tempCanvas, 'eng', { logger: m => {} });
      text = ocrResult.data.text.trim();
    } catch (err) {
      text = "[OCR error]";
    }

    // Append OCR result to output
    textOutput.textContent += `Frame @ ${t.toFixed(2)}s:\n${text}\n\n`;

    //const downloadLSBBtn = document.getElementById("downloadLSBBtn");

    //downloadLSBBtn.addEventListener("click", () => {
    //const blob = new Blob([lsbOutputText], { type: "text/plain" });
    //const url = URL.createObjectURL(blob);
    //const a = document.createElement("a");
    //a.href = url;
    //a.download = "lsb_output.txt";
    //document.body.appendChild(a);
    //a.click();
    //document.body.removeChild(a);
    //URL.revokeObjectURL(url);
    //});

    // Multi-channel LSB extraction
    //const channel = lsbChannel.value;
    //const lsbBits = getLSBBits(imageData, channel);
    //lsbOutputText += `Frame @ ${t.toFixed(2)}s:\n${lsbBits}\n`;

    // Update loading text
    if (loadingText) loadingText.textContent = `Processing frame at ${t.toFixed(1)}s...`;

    // Hide loading indicator and re-enable controls
  if (loadingDiv) loadingDiv.style.display = 'none';
  [redGain, greenGain, blueGain, contrast].forEach(ctrl => ctrl.disabled = false);
}
}
