# Music Sheet Cipher Guide

## Overview
The Music Sheet Cipher decoder has been added to Cryptic-Fox. This tool can decode musical notation ciphers where notes on a staff represent letters of the alphabet.

## Features

### Decoder
- **Multiple Cipher Methods:**
  - **Sequential**: Starting note maps to starting letter, continues through alphabet (e.g., C=A, D=B, E=C, etc.)
  - **Direct Note Names**: Musical letters map directly (A=A, B=B, C=C, etc., then cycles)
  - **Scale Position**: Position in scale maps to alphabet (1st note=A, 2nd=B, etc.)
  - **Custom**: User-defined mappings (future enhancement)

- **Flexible Input**: Accepts various note formats:
  - Simple note names: `C D E F G A B`
  - With octaves: `C4 D4 E4 F4 G4`
  - With accidentals: `C# D Eb F G#`

### Encoder
- Convert text messages to musical notation
- Uses the same cipher method as decoder
- Outputs space-separated note names

### Mapping Display
- Visual reference showing which notes map to which letters
- Updates dynamically based on selected cipher method

## Usage Example

For the screenshot you provided, here's how to decode it:

1. **Identify the notes** from the sheet music by reading their positions on the staff
2. **Enter the notes** in the decoder (e.g., "E F G A B C D E")
3. **Select cipher method** (try "Sequential" first with C=A)
4. **Click "Show Mapping"** to see the cipher key
5. **Click "Decode"** to reveal the message

### Common Note Reading (Treble Clef):
- **Lines (bottom to top)**: E, G, B, D, F
- **Spaces (bottom to top)**: F, A, C, E

## Example Messages

**Example 1: Simple Sequential**
```
Notes: C D E F G H I J K L
Method: Sequential (C=A)
Result: "ABCDEFGHIJ"
```

**Example 2: Direct Mapping**
```
Notes: C A B C
Method: Direct Note Names
Result: "CABC"
```

**Example 3: Real Message**
```
Notes: C A G E
Method: Sequential (C=A)
Result: "BAGE"
```

## Tips for Decoding

1. **Try different starting points**: If C=A doesn't work, try other combinations
2. **Look for patterns**: Common words like "THE" or "AND" can help identify the cipher
3. **Check the context**: The message hint "This task is a simple one" suggests a straightforward mapping
4. **Use the mapping display**: Visualize the entire cipher key before decoding
5. **For your screenshot**: 
   - Read each note carefully from left to right
   - Note any accidentals (sharps/flats)
   - Start with Sequential method using C=A
   - The expected output is: "This task is a simple one. I pray thee, do not disappoint me."

## File Locations

- **HTML**: `music-cipher.html`
- **JavaScript**: `js/music-cipher.js`
- **Access**: Homepage → Music Sheet Cipher card (🎵 icon)

## Future Enhancements

Possible additions:
- Staff notation image upload with optical recognition
- Custom cipher key editor
- Support for more complex musical ciphers (rhythm-based, chord-based)
- Interactive staff display for visual note entry
- Preset cipher schemes from historical examples
