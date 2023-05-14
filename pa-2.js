let latestHandler = null;

const orient = { a: 0, b: 0, g: 0 };

const handleDeviceOrient = async () => {
  if (
    typeof DeviceOrientationEvent?.requestPermission !== 'function' ||
    typeof DeviceOrientationEvent === 'undefined'
  ) {
    alert('DeviceOrientationEvent === undefined');
    throw new Error('DeviceOrientationEvent === undefined');
  }
  try {
    const permission = await DeviceOrientationEvent.requestPermission();
    alert(permission);

    if (permission === 'granted') {
      latestHandler && window.removeEventListener('deviceorientation', latestHandler, true);
      latestHandler = ({ alpha, beta, gamma }) => {
        orient.a = alpha;
        orient.b = beta;
        orient.g = gamma;

        draw();
      };
      window.addEventListener('deviceorientation', latestHandler, true);
    }
  } catch (e) {
    console.error('e', e);
  }
};
