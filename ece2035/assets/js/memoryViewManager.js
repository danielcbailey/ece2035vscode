console.log("NICEEIJAWIODJAW");

let socket = null;
let seed = "";
const vscode = acquireVsCodeApi();

function handleUpdateScreen(data) {
  console.log(
    "message recieved! width:",
    data.width,
    "height:",
    data.height,
    "updates:",
    data.updates.length
  );
  let canvas = document.getElementById("screen");
  let img = document.getElementById("pastScreen");

  if (img.hidden == false) {
    img.hidden = true;
    canvas.hidden = false;
    let saveButton = document.getElementById("save_button");
    saveButton.className = "primary-button";
    saveButton.hidden = false;
    saveButton.disabled = false;
    saveButton.style = "display: inline-block; margin-left: 20px;";
  }

  if (canvas.width != data.width || canvas.height != data.height) {
    canvas.width = data.width;
    canvas.height = data.height;
  }

  let ctx = canvas.getContext("2d");
  ctx.willReadFrequently = true;

  for (let update of data.updates) {
    let x = update.region_x;
    let y = update.region_y;
    let imageData = ctx.getImageData(x, y, 16, 16);

    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        let index = (i * 16 + j) * 4;
        imageData.data[index] = update.data[i * 16 + j] & 0xff; // red
        imageData.data[index + 1] = (update.data[i * 16 + j] >> 8) & 0xff; // green
        imageData.data[index + 2] =
          (update.data[i * 16 + j] >> 16) & 0xff; // blue
        imageData.data[index + 3] = 0xff; // alpha
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  // updating stats
  updateStats(data.stats, data.status);
}

let globalGp;

function handleReadMemory({ base64, gp }) {
  // data is base64, decode it
  const decoded = base64ToBytes(base64);

  globalGp = gp["value"];

  updateHexViewer(0, decoded, globalGp);
}

function base64ToBytes(base64String) {
  const binaryString = atob(base64String);

  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

function showPastScreen(data) {
  let img = document.getElementById("pastScreen");
  let canvas = document.getElementById("screen");
  let saveButton = document.getElementById("save_button");
  saveButton.className = "hidden";
  saveButton.hidden = true;
  saveButton.disabled = true;
  saveButton.style = "opacity: 0;";

  let newImg = new Image();
  let srcUrl = data.image;
  console.log("url", srcUrl);

  newImg.onload = function () {
    let height = newImg.height;
    let width = newImg.width;
    img.width = width;
    img.height = height;

    canvas.hidden = true;
    img.src = srcUrl;
    img.hidden = false;
    updateStats(data.stats, data.status);
  };

  newImg.src = srcUrl;
}

function updateStats(stats, status) {
  if (stats.di == undefined) {
    stats.di = "??";
    stats.si = "??";
    stats.reg = "??";
    stats.mem = "??";
  }

  document.getElementById("stats-di").innerText = stats.di;
  document.getElementById("stats-si").innerText = stats.si;
  document.getElementById("stats-registers").innerText = stats.reg;
  document.getElementById("stats-memory").innerText = stats.mem;

  if (status == "passed" || status == "pass") {
    document.getElementById("stats-status").innerText = "Passed";
    document.getElementById("stats-status").style.color = "green";
  } else if (status == "failed" || status == "fail") {
    document.getElementById("stats-status").innerText = "Failed";
    document.getElementById("stats-status").style.color =
      "var(--vscode-errorForeground)";
  } else if (status == "unknown") {
    document.getElementById("stats-status").innerText = "Not Run";
    document.getElementById("stats-status").style.color =
      "var(--vscode-descriptionForeground)";
  } else {
    document.getElementById("stats-status").innerText = "Still Running";
    document.getElementById("stats-status").style.color =
      "var(--vscode-descriptionForeground)";
  }
}

window.addEventListener("message", (event) => {
  const message = event.data; // Received message
  switch (message.command) {
    case "read_memory":
      handleReadMemory(message.data);
      break;
    case "screen_update":
      handleUpdateScreen(message.data);
      break;
    case "show_past_screen":
      showPastScreen(message.data);
      break;
    case "context_update":
      seed = message.data.seed;
      break;
  }
});

function saveTestCase() {
  console.log("saving testcase");

  // Saving the canvas image data as a base64 png image string
  let canvas = document.getElementById("screen");
  let image = canvas.toDataURL("image/png");
  let data = {
    seed: seed,
    image: image.substring(22),
  };

  // Sending the image data to the parent window
  vscode.postMessage({
    command: "save_testcase",
    data: data,
  });
}


// other
// listen for show instructions
let showInstructions = false;
let showInstructionsCheckmark = document.getElementById("show-instructions");

showInstructionsCheckmark.addEventListener('change', (event) => {
  showInstructions = !showInstructions;
  updateHexViewer(0, memoryData, globalGp);
});

const memoryData = new Array(128).fill(0).map((_, i) => i % 256);
let initialized = false;

function toHex(num) {
  return num.toString(16).padStart(2, "0");
}

function toAscii(num) {
  return num >= 32 && num <= 126 ? String.fromCharCode(num) : ".";
}

function generateHexView() {
  const bytesPerRow = 4;
  const rows = Math.ceil(memoryData.length / bytesPerRow);

  for (let row = 0; row < rows; row++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    const addr = document.createElement("span");
    addr.className = "address";
    addr.textContent = (row * bytesPerRow)
      .toString(16)

      .padStart(8, "0");
    rowDiv.appendChild(addr);

    const hexDiv = document.createElement("div");
    hexDiv.className = "hex-values";

    const asciiDiv = document.createElement("div");
    asciiDiv.className = "ascii";

    for (let col = 0; col < bytesPerRow; col++) {
      const idx = row * bytesPerRow + col;
      if (idx < memoryData.length) {
        const value = memoryData[idx];

        const hexSpan = document.createElement("span");
        hexSpan.className = "hex-value";
        hexSpan.textContent = toHex(value);
        hexSpan.dataset.index = idx;
        hexDiv.appendChild(hexSpan);

        const asciiSpan = document.createElement("span");
        asciiSpan.textContent = toAscii(value);
        asciiSpan.dataset.index = idx;
        asciiDiv.appendChild(asciiSpan);
      }
    }

    rowDiv.appendChild(hexDiv);
    rowDiv.appendChild(asciiDiv);
    document.querySelector(".hex-viewer").appendChild(rowDiv);
  }
}

function getIntegerFromHexRow(row) {

  let hex = row.join('');

  return Number(hex);
}

function updateHexViewer(baseAddress, bytes, gp) {
  console.log(bytes);
  const baseAddress = 0;
  const hexViewer = document.querySelector(".hex-viewer");
  hexViewer.innerHTML = "";

  const bytesPerRow = 4;
  const rows = Math.ceil(bytes.length / bytesPerRow);

  for (let row = 0; row < rows; row++) {
    let isInstruction = baseAddress + row * bytesPerRow < gp;

    /*
    if (isInstruction && !showInstructions) {
      continue;
    }*/

    const rowDiv = document.createElement("div");
    rowDiv.className = "row";

    // address
    const addr = document.createElement("span");
    addr.className = "address";
    addr.textContent = (baseAddress + row * bytesPerRow)
      .toString()
      .padStart(6, "0");
    rowDiv.appendChild(addr);

    // hex
    const hexDiv = document.createElement("div");

    hexDiv.className = "hex-values";

    // ascii
    const asciiDiv = document.createElement("div");
    asciiDiv.className = "ascii";

    for (let col = 0; col < bytesPerRow; col++) {
      const idx = row * bytesPerRow + col;
      if (idx < bytes.length) {
        const value = bytes[idx];

        // hex
        const hexSpan = document.createElement("span");

        if (memoryData[idx] !== value && initialized) {
          // different than last step, let's highlight it
          hexSpan.className = "hex-value-recently-changed";
        } else if (!isInstruction) {
          hexSpan.className = "hex-value";
        } else {
          hexSpan.className = "hex-value-instruction";
        }

        memoryData[idx] = value;

        hexSpan.textContent = value.toString(16).padStart(2, "0");
        hexSpan.dataset.index = idx.toString();
        hexDiv.appendChild(hexSpan);

        // ascii
        const asciiSpan = document.createElement("span");
        asciiSpan.textContent =
          value >= 32 && value <= 126
            ? String.fromCharCode(value)
            : ".";
        asciiSpan.dataset.index = idx.toString();
        asciiDiv.appendChild(asciiSpan);
      }
    }

    rowDiv.appendChild(hexDiv);
    rowDiv.appendChild(asciiDiv);
    hexViewer.appendChild(rowDiv);
  }

  if (!initialized) {
    initialized = true;
  }
}

document.addEventListener("click", (e) => {
  if (
    e.target.matches(".hex-value") ||
    e.target.matches(".ascii span")
  ) {
    // Remove previous selection
    document.querySelectorAll(".selected").forEach((el) => {
      el.classList.remove("selected");
    });

    const idx = e.target.dataset.index;
    document.querySelectorAll(`[data-index="${idx}"]`).forEach((el) => {
      el.classList.add("selected");
    });
  }
});

generateHexView();
