import zlib from "zlib";

export function extractTextFromDocx(buffer: Buffer): string {
  try {
    let xmlContent: string | null = null;

    // 1. Locate End of Central Directory (EOCD)
    // EOCD signature is 0x06054b50 ('PK\x05\x06')
    let eocdOffset = -1;
    const minSearch = Math.max(0, buffer.length - 65557);
    for (let i = buffer.length - 22; i >= minSearch; i--) {
      if (
        buffer[i] === 0x50 &&
        buffer[i + 1] === 0x4b &&
        buffer[i + 2] === 0x05 &&
        buffer[i + 3] === 0x06
      ) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset !== -1) {
      const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
      const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

      let pos = cdOffset;
      for (let i = 0; i < totalEntries && pos < eocdOffset; i++) {
        if (buffer.readUInt32LE(pos) !== 0x02014b50) break; // Central header magic

        const compMethod = buffer.readUInt16LE(pos + 10);
        const compSize = buffer.readUInt32LE(pos + 20);
        const fnLen = buffer.readUInt16LE(pos + 28);
        const extraLen = buffer.readUInt16LE(pos + 30);
        const commentLen = buffer.readUInt16LE(pos + 32);
        const localOffset = buffer.readUInt32LE(pos + 42);

        const fileName = buffer.toString("utf8", pos + 46, pos + 46 + fnLen);
        if (fileName === "word/document.xml") {
          // Read local header
          if (localOffset + 30 <= buffer.length && buffer.readUInt32LE(localOffset) === 0x04034b50) {
            const localFnLen = buffer.readUInt16LE(localOffset + 26);
            const localExtraLen = buffer.readUInt16LE(localOffset + 28);
            const dataStart = localOffset + 30 + localFnLen + localExtraLen;
            const compressedSlice = buffer.subarray(dataStart, dataStart + compSize);

            if (compMethod === 8) {
              const decompressed = zlib.inflateRawSync(compressedSlice);
              xmlContent = decompressed.toString("utf8");
            } else if (compMethod === 0) {
              xmlContent = compressedSlice.toString("utf8");
            }
          }
          break;
        }

        pos += 46 + fnLen + extraLen + commentLen;
      }
    }

    // 2. Fallback: sequential scan for word/document.xml local header
    if (!xmlContent) {
      for (let i = 0; i <= buffer.length - 30; i++) {
        if (
          buffer[i] === 0x50 &&
          buffer[i + 1] === 0x4b &&
          buffer[i + 2] === 0x03 &&
          buffer[i + 3] === 0x04
        ) {
          const compMethod = buffer.readUInt16LE(i + 8);
          const compSize = buffer.readUInt32LE(i + 18);
          const fnLen = buffer.readUInt16LE(i + 26);
          const extraLen = buffer.readUInt16LE(i + 28);
          const name = buffer.toString("utf8", i + 30, i + 30 + fnLen);

          if (name === "word/document.xml") {
            const dataStart = i + 30 + fnLen + extraLen;
            const slice = compSize > 0
              ? buffer.subarray(dataStart, dataStart + compSize)
              : buffer.subarray(dataStart);

            try {
              if (compMethod === 8) {
                const decompressed = zlib.inflateRawSync(slice);
                xmlContent = decompressed.toString("utf8");
              } else if (compMethod === 0) {
                xmlContent = (compSize > 0 ? slice : buffer.subarray(dataStart, dataStart + 100000)).toString("utf8");
              }
            } catch (err) {
              console.warn("[DocxParser] Sequential scan inflation failed:", err);
            }
            break;
          }
        }
      }
    }

    if (!xmlContent) {
      return "";
    }

    // 3. Convert word/document.xml into clean plaintext
    return xmlContent
      .replace(/<w:p[ >]/gi, "\n<w:p>")
      .replace(/<\/w:p>/gi, "\n")
      .replace(/<w:br[^>]*\/?>/gi, "\n")
      .replace(/<w:tab[^>]*\/?>/gi, "\t")
      .replace(/<\/w:tr>/gi, "\n")
      .replace(/<\/w:tc>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n\n");
  } catch (err) {
    console.warn("[DocxParser] Failed to extract text from docx:", err);
    return "";
  }
}

