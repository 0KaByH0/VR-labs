let panner = null;
let filter = null;
let ctx = null;

const fetchSound = (soundFileName) =>
  new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open('GET', soundFileName, true);
    request.responseType = 'arraybuffer';
    request.onload = () => resolve(request.response);
    request.send();
  });

const loadAudio = async (soundFileName) => {
  ctx = new AudioContext();
  const mainVolume = ctx.createGain();
  mainVolume.connect(ctx.destination);
  const sound = { source: ctx.createBufferSource(), volume: ctx.createGain() };

  sound.source.connect(sound.volume);
  sound.volume.connect(mainVolume);

  sound.buffer = await fetchSound(soundFileName).then((buffer) => ctx.decodeAudioData(buffer));
  sound.source.buffer = sound.buffer;
  sound.source.start(ctx.currentTime);

  panner = ctx.createPanner();
  filter = ctx.createBiquadFilter();

  sound.source.connect(panner);
  panner.connect(filter);
  filter.connect(ctx.destination);

  filter.type = 'highshelf';
  filter.frequency.value = 1000;
  filter.gain.value = 30;
  filter.Q.value = 3;
  filter.detune.value = -1000;

  return [sound, panner];
};
