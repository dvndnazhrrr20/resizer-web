function resizeImage() {
    const fileInput = document.getElementById('imageInput');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const imageContainer = document.getElementById('imageContainer');
  
    const file = fileInput.files[0];
    const reader = new FileReader();
  
    reader.onload = function(event) {
      const img = new Image();
      img.src = event.target.result;
  
      img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = parseInt(widthInput.value);
        canvas.height = parseInt(heightInput.value);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedImage = new Image();
        resizedImage.src = canvas.toDataURL('image/jpeg');
        imageContainer.innerHTML = '';
        imageContainer.appendChild(resizedImage);
      };
    };
  
    reader.readAsDataURL(file);
  }
  
  function compressAudio() {
    const fileInput = document.getElementById('audioInput');
    const compressionRatioInput = document.getElementById('compressionRatio');
  
    const file = fileInput.files[0];
    const reader = new FileReader();
  
    reader.onload = function(event) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioData = event.target.result;
  
      audioContext.decodeAudioData(audioData, function(buffer) {
        const compressedAudio = buffer;
        const audioBlob = bufferToWave(compressedAudio);
  
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(audioBlob);
        downloadLink.download = 'compressed_audio.wav';
        downloadLink.click();
      });
    };
  
    reader.readAsArrayBuffer(file);
  }
  
  // Function to convert AudioBuffer to WAV Blob
  function bufferToWave(abuffer) {
    const numberOfChannels = abuffer.numberOfChannels;
    const length = abuffer.length * numberOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
  
    writeString(view, 0, 'RIFF'); // RIFF identifier
    view.setUint32(4, 36 + abuffer.length * 2, true); // file length minus RIFF identifier length and file description length
    writeString(view, 8, 'WAVE'); // RIFF type
    writeString(view, 12, 'fmt '); // format chunk identifier
    view.setUint32(16, 16, true); // format chunk length
    view.setUint16(20, 1, true); // sample format (raw)
    view.setUint16(22, numberOfChannels, true); // channel count
    view.setUint32(24, abuffer.sampleRate, true); // sample rate
    view.setUint32(28, abuffer.sampleRate * 2 * numberOfChannels, true); // byte rate
    view.setUint16(32, numberOfChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(view, 36, 'data'); // data chunk identifier
    view.setUint32(40, abuffer.length * 2 * numberOfChannels, true); // data chunk length
  
    // write the PCM samples
    floatTo16BitPCM(view, 44, abuffer.getChannelData(0));
  
    // interleave (if stereo)
    if (numberOfChannels > 1) {
      interleave(view, 44, abuffer.getChannelData(0), abuffer.getChannelData(1));
    }
  
    return new Blob([view], { type: 'audio/wav' });
  }
  
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
  
  function interleave(output, offset, leftChannel, rightChannel) {
    for (let i = 0; i < leftChannel.length; i++, offset += 4) {
      const leftSample = leftChannel[i];
      const rightSample = rightChannel[i];
      output.setInt16(offset, leftSample * 0x7FFF, true);
      output.setInt16(offset + 2, rightSample * 0x7FFF, true);
    }
  }
  