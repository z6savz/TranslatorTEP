// lsb-worker.js

// Known magic numbers to look out for.
// All hex strings MUST be lowercase — they are compared against lowercase output from toString(16).
const MAGIC_NUMBERS = [
    { name: 'PNG Image',             hex: '89504e470d0a1a0a' },
    { name: 'JPEG Image (JFIF)',      hex: 'ffd8ffe0' },
    { name: 'JPEG Image (EXIF)',      hex: 'ffd8ffe1' },  // most common modern camera format
    { name: 'JPEG Image',            hex: 'ffd8ffe2' },
    { name: 'JPEG Image',            hex: 'ffd8ffdb' },
    { name: 'JPEG Image (baseline)', hex: 'ffd8ffc0' },
    { name: 'JPEG Image (progressive)', hex: 'ffd8ffc2' },
    { name: 'JPEG Image (SPIFF)',     hex: 'ffd8ffee' },
    { name: 'GIF Image',             hex: '47494638' },
    { name: 'BMP Image',             hex: '424d' },
    { name: 'TIFF Image (LE)',        hex: '49492a00' },
    { name: 'TIFF Image (BE)',        hex: '4d4d002a' },
    { name: 'ZIP Archive (or DOCX)', hex: '504b0304' },
    { name: 'PDF Document',          hex: '25504446' },
    { name: 'RAR Archive',           hex: '526172211a0700' },
    { name: 'MP3 Audio (ID3)',        hex: '494433' },
    { name: 'FLAC Audio',            hex: '664c6143' },
    { name: 'OGG Media',             hex: '4f676753' },
    { name: 'ELF Executable',        hex: '7f454c46' },
    { name: 'GZIP Archive',          hex: '1f8b' },
    { name: '7-Zip Archive',         hex: '377abcaf271c' },
    { name: 'MP4/MOV (ftyp atom)',    hex: '66747970' }  // ftyp is at offset 4 in valid files
];

// Build a hex dump preview (xxd-style) of up to maxBytes of binary data.
function buildHexDump(data, maxBytes) {
    const dumpLen = Math.min(data.length, maxBytes);
    const lines = [];
    for (let row = 0; row < dumpLen; row += 16) {
        const end = Math.min(row + 16, dumpLen);
        const hexPart = [];
        const asciiPart = [];
        for (let col = row; col < end; col++) {
            const byte = data[col];
            hexPart.push(byte.toString(16).padStart(2, '0'));
            asciiPart.push(byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.');
        }
        // Pad final row so the ASCII column stays aligned
        while (hexPart.length < 16) hexPart.push('  ');
        const offset = row.toString(16).padStart(8, '0');
        lines.push(
            `${offset}  ${hexPart.slice(0, 8).join(' ')}  ${hexPart.slice(8).join(' ')}  |${asciiPart.join('')}|`
        );
    }
    if (data.length > maxBytes) {
        lines.push(`... (${data.length - maxBytes} more bytes — download binary for full data)`);
    }
    return lines.join('\n');
}

self.onmessage = function (e) {
    const { framesData, channel, selectedBits } = e.data;
    // framesData is an array of { timestamp, width, height, data }

    let totalPixels = 0;
    for (let f of framesData) {
        totalPixels += (f.data.length / 4);
    }

    let bitsPerPixel = selectedBits.length;
    if (channel === "all") bitsPerPixel *= 3;

    const totalBits = totalPixels * bitsPerPixel;
    const byteLength = Math.ceil(totalBits / 8);
    const binaryData = new Uint8Array(byteLength);

    let byteIndex = 0;
    let bitIndexInByte = 0;
    let currentByte = 0;
    // Accumulate text segments in an array to avoid O(n²) string concatenation
    const textParts = [];
    let totalTextChars = 0;
    const maxTextChars = 50000;

    // Pre-compute which channel byte offsets to read
    const channelOffsets = [];
    if (channel === "all" || channel === "red")   channelOffsets.push(0);
    if (channel === "all" || channel === "green") channelOffsets.push(1);
    if (channel === "all" || channel === "blue")  channelOffsets.push(2);

    // Report progress based on total pixels so single-frame files show meaningful progress
    const progressStep = Math.max(1, Math.floor(totalPixels / 100));
    let processedPixels = 0;
    let lastReportedPercent = -1;

    for (let fi = 0; fi < framesData.length; fi++) {
        const f = framesData[fi];

        if (totalTextChars < maxTextChars) {
            const frameStr = `Frame @ ${f.timestamp}:\n`;
            textParts.push(frameStr);
            totalTextChars += frameStr.length;
        }

        const data = f.data;
        for (let i = 0; i < data.length; i += 4) {
            // Report progress every ~1% of total pixels for smooth updates on single frames
            if (processedPixels % progressStep === 0) {
                const percent = Math.min(99, Math.round((processedPixels / totalPixels) * 100));
                if (percent !== lastReportedPercent) {
                    self.postMessage({ type: 'progress', percent });
                    lastReportedPercent = percent;
                }
            }
            processedPixels++;

            // Inline bit extraction to avoid per-pixel array allocation
            for (let ci = 0; ci < channelOffsets.length; ci++) {
                const val = data[i + channelOffsets[ci]];
                for (let bi = 0; bi < selectedBits.length; bi++) {
                    const bit = (val >> selectedBits[bi]) & 1;
                    if (bit) currentByte |= (1 << (7 - bitIndexInByte));
                    bitIndexInByte++;
                    if (bitIndexInByte === 8) {
                        binaryData[byteIndex++] = currentByte;
                        currentByte = 0;
                        bitIndexInByte = 0;
                    }
                    if (totalTextChars < maxTextChars) {
                        textParts.push(bit ? '1' : '0');
                        totalTextChars++;
                    }
                }
            }
            if (totalTextChars < maxTextChars && ((i / 4 + 1) % f.width) === 0) {
                textParts.push('\n');
                totalTextChars++;
            }
        }

        if (totalTextChars < maxTextChars) {
            textParts.push('\n');
            totalTextChars++;
        }
    }

    let textOutput = textParts.join('');

    // Push remaining partial byte if any
    if (bitIndexInByte > 0) {
        binaryData[byteIndex] = currentByte;
    }

    if (totalTextChars >= maxTextChars) {
        textOutput += "\n... [TRUNCATED FOR BROWSER PERFORMANCE]\nDownload Binary to view complete data.";
    }

    // Magic number detection
    // Build lowercase hex string of the first 256 bytes for signature scanning.
    // Using 256 bytes catches headers with small amounts of padding/metadata before the signature.
    const searchLen = Math.min(binaryData.length, 256);
    let hexHeader = "";
    for (let i = 0; i < searchLen; i++) {
        hexHeader += binaryData[i].toString(16).padStart(2, '0');
    }

    let detectedSignatures = [];
    for (let sig of MAGIC_NUMBERS) {
        // Both hexHeader and sig.hex are lowercase — safe case-sensitive comparison
        const needle = sig.hex.toLowerCase();
        const idx = hexHeader.indexOf(needle);
        if (idx !== -1) {
            const byteOffset = idx / 2; // each byte = 2 hex chars
            detectedSignatures.push(`${sig.name} (at byte offset ${byteOffset})`);
        }
    }

    // Build hex dump preview and prepend to the output
    const hexDumpPreview = buildHexDump(binaryData, 512);
    const finalOutput =
        `=== Hex Dump (first ${Math.min(binaryData.length, 512)} bytes) ===\n${hexDumpPreview}` +
        `\n\n=== Raw LSB Bit Stream ===\n${textOutput}`;

    self.postMessage({
        type: 'done',
        textOutput: finalOutput,
        binaryData: binaryData,
        signatures: detectedSignatures
    }, [binaryData.buffer]);
};
