import { Directory, File, FileMode, Paths } from 'expo-file-system';

type EmbeddedMetadata = { title?: string; artist?: string; album?: string; artwork?: string };

const textFromBytes = (bytes: Uint8Array, encoding: number) => {
  try {
    if (encoding === 1 || encoding === 2) {
      const bigEndian = encoding === 2 || (bytes[0] === 0xFE && bytes[1] === 0xFF);
      const start = (bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF) ? 2 : 0;
      const normalized = bytes.slice(start);
      if (bigEndian) for (let i = 0; i + 1 < normalized.length; i += 2) [normalized[i], normalized[i + 1]] = [normalized[i + 1], normalized[i]];
      return new TextDecoder('utf-16le').decode(normalized).replace(/\0/g, '').trim();
    }
    return new TextDecoder(encoding === 3 ? 'utf-8' : 'iso-8859-1').decode(bytes).replace(/\0/g, '').trim();
  } catch { return ''; }
};

const readSize = (bytes: Uint8Array, offset: number, synchsafe: boolean) => synchsafe
  ? ((bytes[offset] & 0x7f) << 21) | ((bytes[offset + 1] & 0x7f) << 14) | ((bytes[offset + 2] & 0x7f) << 7) | (bytes[offset + 3] & 0x7f)
  : (bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];

// Read only the ID3 header, not the entire audio file. MP3 ID3v2.3/v2.4 support.
// Unsupported formats safely fall back to parsing Artist - Title from the filename.
export async function readEmbeddedMetadata(file: File, id: string): Promise<EmbeddedMetadata> {
  if (!file.name.toLowerCase().endsWith('.mp3')) return {};
  const handle = file.open(FileMode.ReadOnly);
  try {
    const header = await handle.readBytes(10);
    if (header.length !== 10 || String.fromCharCode(...header.slice(0, 3)) !== 'ID3') return {};
    const version = header[3];
    if (version !== 3 && version !== 4) return {};
    const tagSize = readSize(header, 6, true);
    if (tagSize < 10 || tagSize > 8 * 1024 * 1024) return {};
    const bytes = await handle.readBytes(tagSize);
    const result: EmbeddedMetadata = {};
    let offset = 0;
    if (header[5] & 0x40) {
      const extended = readSize(bytes, 0, version === 4);
      offset = version === 4 ? extended : extended + 4;
    }
    while (offset + 10 <= bytes.length) {
      const code = String.fromCharCode(...bytes.slice(offset, offset + 4));
      if (!/^[A-Z0-9]{4}$/.test(code)) break;
      const size = readSize(bytes, offset + 4, version === 4);
      if (size < 1 || offset + 10 + size > bytes.length) break;
      const data = bytes.slice(offset + 10, offset + 10 + size);
      if (code === 'TIT2') result.title = textFromBytes(data.slice(1), data[0]);
      if (code === 'TPE1') result.artist = textFromBytes(data.slice(1), data[0]);
      if (code === 'TALB') result.album = textFromBytes(data.slice(1), data[0]);
      if (code === 'APIC' && data.length > 20) {
        // APIC: encoding, MIME, 0, picture type, description, image data.
        let pos = 1;
        while (pos < data.length && data[pos] !== 0) pos++;
        const mime = textFromBytes(data.slice(1, pos), 0);
        pos += 2; // NUL and picture type
        const encoding = data[0];
        if (encoding === 1 || encoding === 2) {
          while (pos + 1 < data.length && !(data[pos] === 0 && data[pos + 1] === 0)) pos += 2;
          pos += 2;
        } else { while (pos < data.length && data[pos] !== 0) pos++; pos++; }
        const artwork = data.slice(pos);
        if (artwork.length > 200 && artwork.length < 6 * 1024 * 1024 && /^image\/(jpeg|png)$/i.test(mime)) {
          const folder = new Directory(Paths.document, 'artwork');
          folder.create({ idempotent: true, intermediates: true });
          const image = new File(folder, `${id}.${mime.toLowerCase().endsWith('png') ? 'png' : 'jpg'}`);
          image.create({ overwrite: true });
          await image.write(artwork);
          result.artwork = image.uri;
        }
      }
      offset += 10 + size;
    }
    return result;
  } catch (error) {
    console.warn('Metadata unavailable:', error);
    return {};
  } finally { handle.close(); }
}
