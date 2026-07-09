const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

function writeWav(filename, duration, sampleRate, dataGen) {
    const numSamples = duration * sampleRate;
    const buffer = Buffer.alloc(44 + numSamples);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples, 4);
    buffer.write('WAVE', 8);
    
    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // subchunk size
    buffer.writeUInt16LE(1, 20);  // PCM format
    buffer.writeUInt16LE(1, 22);  // mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate, 28); // byte rate (sampleRate * 1 channel * 1 byte/sample)
    buffer.writeUInt16LE(1, 32);  // block align
    buffer.writeUInt16LE(8, 34);  // bits per sample (8)
    
    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples, 40);
    
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const val = dataGen(t);
        const byteVal = Math.max(0, Math.min(255, Math.floor(val)));
        buffer.writeUInt8(byteVal, 44 + i);
    }
    
    fs.writeFileSync(path.join(dir, filename), buffer);
    console.log(`Generated ${filename}`);
}

// 1. default.wav - clean pulse chime
writeWav('default.wav', 1.0, 8000, (t) => {
    return 128 + 120 * Math.sin(2 * Math.PI * 523.25 * t) * Math.exp(-3 * t);
});

// 2. bell.wav - classic double chime
writeWav('bell.wav', 1.5, 8000, (t) => {
    const chime1 = Math.sin(2 * Math.PI * 659.25 * t) * Math.exp(-2 * t);
    const chime2 = t > 0.3 ? Math.sin(2 * Math.PI * 523.25 * (t - 0.3)) * Math.exp(-2 * (t - 0.3)) : 0;
    return 128 + 60 * chime1 + 60 * chime2;
});

// 3. alarm.wav - digital alarm pulses
writeWav('alarm.wav', 1.5, 8000, (t) => {
    const isBeep = (t % 0.3) < 0.15;
    return 128 + (isBeep ? 120 * Math.sin(2 * Math.PI * 880 * t) : 0);
});

// 4. red_alert.wav - urgent siren sliding pitch
writeWav('red_alert.wav', 2.0, 8000, (t) => {
    const phase = 2 * Math.PI * 500 * t + 10 * Math.sin(2 * Math.PI * 2 * t);
    return 128 + 120 * Math.sin(phase);
});

console.log('All sound files generated successfully under public/sounds/');
