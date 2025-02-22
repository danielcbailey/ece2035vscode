import { BYTES_PER_ROW } from "../App";

export default function MemoryView({ title, baseAddress, memoryData, oldMemory, reverse }) {
  if (!memoryData) {
    return <></>
  }

  const rows = Math.ceil(memoryData.length / BYTES_PER_ROW);

  let rowData =
    [...Array(rows)].map((_, row) => {
      return (
        <div className='row'>
          <span className='address'>{(baseAddress + row * BYTES_PER_ROW).toString().padStart(6, "0")}</span>
          <div className='hex-values'>
            {[...Array(BYTES_PER_ROW)].map((_, col) => {
              const idx = row * BYTES_PER_ROW + col;
              if (idx < memoryData.length) {
                const value = memoryData[idx];

                let hexIdentifier;

                // TODO: Replace with old memory system (show deltas)
                if (false && oldMemory.current[idx] !== value) {
                  // different than last step, let's highlight it
                  hexIdentifier = "hex-value-recently-changed";
                  // oldMemory.current[idx] = value; 
                } else {
                  hexIdentifier = "hex-value";
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

  return <div>
    <h5>{title}</h5>

    <div class="hex-viewer">
      {rowData}
    </div>

  </div>
}