

// eslint-disable-next-line no-undef

import { useEffect, useState } from "react";
import Badge, { BadgeType } from "../component/Badge";

let socket = null;
let seed = "";

function handleUpdateScreen(data, setStatus) {
  console.log("message recieved! width:", data.width, "height:", data.height, "updates:", data.updates.length);
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
    canvas.clientWidth = Math.min(canvas.clientWidth, 400);
    canvas.clientHeight = Math.min(canvas.clientWidth, 400);
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
        imageData.data[index] = update.data[i * 16 + j] & 0xFF; // red
        imageData.data[index + 1] = (update.data[i * 16 + j] >> 8) & 0xFF; // green
        imageData.data[index + 2] = (update.data[i * 16 + j] >> 16) & 0xFF; // blue
        imageData.data[index + 3] = 0xFF; // alpha
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  // updating stats
  updateStats(data.stats, data.status, setStatus);
}

function showPastScreen(data, setStatus) {
  let img = document.getElementById("pastScreen");
  let canvas = document.getElementById("screen");
  let saveButton = document.getElementById("save_button");
  saveButton.className = "hidden";
  saveButton.hidden = true;
  saveButton.disabled = true;
  saveButton.style = "opacity: 0;"

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
    updateStats(data.stats, data.status, setStatus);
  }

  newImg.src = srcUrl;
}

function updateStats(stats, status, setStatus) {
  let newStatus;

  if (status === "passed" || status === "pass") {
    newStatus = BadgeType.SUCCESS;
  } else if (status === "failed" || status === "fail") {
    newStatus = BadgeType.FAILED;
  } else if (status === "unknown") {
    newStatus = BadgeType.NOT_STARTED;
  } else {
    newStatus = BadgeType.IN_PROGRESS;
  }

  setStatus(newStatus);

  if (stats.di === undefined) {
    stats.di = "??";
    stats.si = "??";
    stats.reg = "??";
    stats.mem = "??";
  }

  document.getElementById("stats-di").innerText = stats.di;
  document.getElementById("stats-si").innerText = stats.si;
  document.getElementById("stats-registers").innerText = stats.reg;
  document.getElementById("stats-memory").innerText = stats.mem;

  // if (status == "passed" || status == "pass") {
  //   document.getElementById("stats-status").innerText = "Passed";
  //   document.getElementById("stats-status").style.color = "green";
  // } else if (status == "failed" || status == "fail") {
  //   document.getElementById("stats-status").innerText = "Failed";
  //   document.getElementById("stats-status").style.color = "var(--vscode-errorForeground)";
  // } else if (status == "unknown") {
  //   document.getElementById("stats-status").innerText = "Not Run";
  //   document.getElementById("stats-status").style.color = "var(--vscode-descriptionForeground)";
  // } else {
  //   document.getElementById("stats-status").innerText = "Still Running";
  //   document.getElementById("stats-status").style.color = "var(--vscode-descriptionForeground)";
  // }

}


function saveTestCase(vscode) {
  console.log("saving testcase");

    // Saving the canvas image data as a base64 png image string
    let canvas = document.getElementById("screen");
    let image = canvas.toDataURL("image/png");
    let data = {
      seed: seed,
      image: image.substring(22)
    };

    // Sending the image data to the parent window
    vscode.postMessage({
      command: 'save_testcase',
      data: data
    });
}

export default function ScreenView({ vscode }) {
  const [ status, setStatus ] = useState(BadgeType.IN_PROGRESS);

  useEffect(() => {

    window.addEventListener('message', event => {
      const message = event.data; // Received message
      console.log("received ", message.command);
      switch (message.command) {
        case 'screen_update':
          handleUpdateScreen(message.data, setStatus);
          break;
        case 'show_past_screen':
          showPastScreen(message.data, setStatus);
          break;
        case 'context_update':
          seed = message.data.seed;
          break;
        default:
          break;
      }
    });
  }, [])

  return <>
    <body>
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ marginRight: "2rem" }}>RISC-V Screen View</h2>
      
        <button onClick={() => { saveTestCase(vscode)}} id="save_button" style={{marginRight: "0.50rem", height: "2rem"}} className="primary-button">Save as Testcase</button>


        <Badge badgeType={status}/>
      </div>
      <div style={{ display: "flex", justifyContent: "center"}}>
        <canvas id="screen" width="160" height="160"></canvas>
        <img alt="pattern" width="160" height="160" hidden="true" id="pastScreen" />
      </div>


      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <div style={{ borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#718096' }}>Dynamic Instructions</p>
            <p id="stats-di" style={{ fontSize: '1.25rem', fontWeight: '700' }}>0</p>
          </div>
          <div style={{ borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#718096' }}>Static Instructions</p>
            <p id="stats-si" style={{ fontSize: '1.25rem', fontWeight: '700' }}>0</p>
          </div>
          <div style={{ borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#718096' }}>Registers Used</p>
            <p id="stats-registers" style={{ fontSize: '1.25rem', fontWeight: '700' }}>0</p>
          </div>
          <div style={{ borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#718096' }}>Memory Used</p>
            <p id="stats-memory" style={{ fontSize: '1.25rem', fontWeight: '700' }}>0</p>
        </div>
    </div>
    </body>

  </>
}
