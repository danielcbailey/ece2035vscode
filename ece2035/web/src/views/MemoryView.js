import { BYTES_PER_ROW } from "../App";

export default function MemoryView({ title, gp, baseAddress, memoryData, oldMemory, showInstructions, reverse, memoryEnd }) {
  const rows = Math.ceil(memoryData.length / BYTES_PER_ROW);

  let rowData =
    [...Array(rows)].map((_, row) => {
      const isInstruction = baseAddress + row * BYTES_PER_ROW < gp;

      if (isInstruction && !showInstructions) {
        return <></>
      }

      return (
        <div className='row'>
          <span className='address'>{(baseAddress + row * BYTES_PER_ROW).toString().padStart(6, "0")}</span>
          <div className='hex-values'>
            {[...Array(BYTES_PER_ROW)].map((_, col) => {
              const idx = row * BYTES_PER_ROW + col;
              if (idx < memoryData.length) {
                const value = memoryData[idx];

                let hexIdentifier;

                if (false && oldMemory.current[idx] !== value) {
                  // different than last step, let's highlight it
                  hexIdentifier = "hex-value-recently-changed";
                  // oldMemory.current[idx] = value; 
                } else if (!isInstruction) {
                  hexIdentifier = "hex-value";
                } else {
                  hexIdentifier = "hex-value-instruction";
                }

                return (
                  <span className={`${hexIdentifier} hex-value`}>{value.toString(16).padStart(2, "0")}</span>
                )
              }
              return <></>
            })}
          </div>
        </div>);
    });

  if (reverse) {
    rowData = rowData.reverse();
  }

  return <div>
    <h5>{title}</h5>

    <div class="hex-viewer">
      {rowData}
    </div>

  </div>
}