import './App.css';
import MemoryView from './views/MemoryView';
import ScreenView from './views/ScreenView';
import { useEffect, useRef, useState } from 'react';
import { base64ToBytes } from './util/hexUtils';

let seed = "";

// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();

export const BYTES_PER_ROW = 4;

function handleUpdateScreen(data) {
  let canvas = document.getElementById("screen");
  let img = document.getElementById("pastScreen");

  if (img === null || img === undefined || !img || !Object.hasOwn(img, "hidden")) {
    return;
  }

  if (img.hidden === false) {
    img.hidden = true;
    canvas.hidden = false;
    let saveButton = document.getElementById("save_button");
    saveButton.className = "primary-button";
    saveButton.hidden = false;
    saveButton.disabled = false;
    saveButton.style = "display: inline-block; margin-left: 20px;";
  }

  if (canvas.width !== data.width || canvas.height !== data.height) {
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

function handleReadMemory({ mainMemory, stackMemory, gp, sp, setMemoryData, setStackData, setGp, setSp }) {
  // data is base64, decode it
  const stackDecoded = base64ToBytes(stackMemory);
  const memoryDecoded = base64ToBytes(mainMemory);

  setMemoryData(memoryDecoded);
  setStackData(stackDecoded);
  setGp(gp["value"]);
  setSp(sp);

  if (!initialized) {
    initialized = true;
  }

  // updateHexViewer(decoded, globalGp, setMemoryData, setGp);
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

  // if (status === "passed" || status === "pass") {
  //   document.getElementById("stats-status").innerText = "Passed";
  //   document.getElementById("stats-status").style.color = "green";
  // } else if (status === "failed" || status === "fail") {
  //   document.getElementById("stats-status").innerText = "Failed";
  //   document.getElementById("stats-status").style.color =
  //     "var(--vscode-errorForeground)";
  // } else if (status === "unknown") {
  //   document.getElementById("stats-status").innerText = "Not Run";
  //   document.getElementById("stats-status").style.color =
  //     "var(--vscode-descriptionForeground)";
  // } else {
  //   document.getElementById("stats-status").innerText = "Still Running";
  //   document.getElementById("stats-status").style.color =
  //     "var(--vscode-descriptionForeground)";
  // }
}


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

let initialized = false;

function App() {
  const oldMemory = useRef(new Array(128).fill(0));
  const [stackData, setStackData] = useState(new Array(128).fill(0));
  const [memoryData, setMemoryData] = useState(new Array(128).fill(0));
  const [gp, setGp] = useState(0);
  const [sp, setSp] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);

  useEffect(() => {
    window.addEventListener("message", (event) => {

      console.log("Received ", event.data);
      const message = event.data; // Received message
      switch (message.command) {
        case "read_memory":
          handleReadMemory({
            mainMemory: message.data.mainMemory,
            stackMemory: message.data.stackMemory,
            gp: message.data.gp,
            sp: message.data.sp,
            setMemoryData: setMemoryData,
            setStackData: setStackData,
            setGp: setGp,
            setSp: setSp,
          });

          setIsDebugging(true);
          break;
        case "screen_update":
          handleUpdateScreen(message.data);
          break;
        case "show_past_screen":
          showPastScreen(message.data);
          setIsDebugging(false);
          break;
        case "context_update":
          seed = message.data.seed;
          break;
        default:
          break;
      }
    });

    vscode.postMessage({ command: 'ready' });

  }, [])

  const baseAddress = 0;

  const onInstructionToggle = () => {
    setShowInstructions(!showInstructions);
  }

  return (
    <>
      <ScreenView vscode={vscode}/>

      { isDebugging ?  <> <label class="vscode-checkbox">
        <input onChange={() => onInstructionToggle()} id="show-instructions" type="checkbox" />
        <div class="checkmark"></div>
        <span>Show instructions</span>
      </label>
      <div className='flex-container'>
        <div>
          <MemoryView showInstructions={showInstructions} title={"Memory"} gp={gp} baseAddress={baseAddress} memoryData={memoryData} oldMemory={oldMemory} />
        </div>
        <div>
          <MemoryView reverse={true} showInstructions={showInstructions} title={"Stack"} gp={gp} baseAddress={sp} memoryData={stackData} oldMemory={oldMemory} />
        </div>
      </div></> : <></>}
    </>
  );
}

export default App;
