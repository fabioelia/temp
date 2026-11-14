// Saving files: straight downloads in a normal browser tab, or through the viewer's save prompt
// when Caliper runs as a Claude artifact (which only accepts a fixed list of file types).

const ARTIFACT_OK = new Set(['json', 'zip', 'txt', 'csv', 'svg', 'png', 'pdf', 'md', 'html']);

let downloadsPromise = null;
function downloads() {
  downloadsPromise ||= (async () => {
    try {
      return (await window.claude?.use?.('downloads')) || null;
    } catch {
      return null;
    }
  })();
  return downloadsPromise;
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Minimal ZIP (stored, no compression) holding one or more files.
export function zip(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name);
    const data = f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data);
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, 20, true);
    head.setUint16(8, 0, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, data.length, true);
    head.setUint32(22, data.length, true);
    head.setUint16(26, name.length, true);
    parts.push(new Uint8Array(head.buffer), name, data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

export const safeName = (s) => (String(s || 'part').replace(/[^\w\- .]+/g, '').trim().replace(/\s+/g, '-') || 'part').slice(0, 60);

// Returns a short sentence describing what happened, for a toast.
export async function saveFile(filename, data, mime = 'application/octet-stream') {
  const ext = filename.split('.').pop().toLowerCase();
  const dl = await downloads();
  if (dl) {
    let name = filename;
    let payload = typeof data === 'string' ? data : new Blob([data], { type: mime });
    if (!ARTIFACT_OK.has(ext)) {
      const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      payload = zip([{ name: filename, data: bytes }]);
      name = `${filename}.zip`;
    }
    try {
      await dl.save({ filename: name, data: payload });
      return name === filename ? `Saved ${name}` : `Saved ${name} (unzip it to get ${filename})`;
    } catch (e) {
      if (e?.code === 'declined') return '';
      throw new Error(e?.code === 'rate_limited' ? 'A save prompt is already open. Answer it, then try again.' : 'This view cannot save files. Open Caliper in claude.ai or run it locally.');
    }
  }
  if (window.claude?.use) throw new Error('This view cannot save files. Open Caliper in claude.ai or run it locally.');
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return `Saved ${filename}`;
}
