export function toHex(num) {
  return num.toString(16).padStart(2, "0");
}

export function toAscii(num) {
  return num >= 32 && num <= 126 ? String.fromCharCode(num) : ".";
}

export function base64ToBytes(base64String) {
  const binaryString = atob(base64String);

  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

export function getIntegerFromHexRow(row) {

  let hex = row.join('');

  return Number(hex);
}
