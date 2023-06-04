function createSphereData(scale, iSeg, jSeg) {
  const vertex = [];
  const texture = [];

  for (let i = 0; i <= iSeg; i++) {
    const t = (i * Math.PI) / iSeg;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    for (let j = 0; j <= jSeg; j++) {
      const phi = (j * 2 * Math.PI) / jSeg;

      const x = scale * Math.cos(phi) * sinT;
      const y = scale * cosT;
      const z = scale * Math.sin(phi) * sinT;

      vertex.push(x, y, z);

      texture.push(1 - j / jSeg, 1 - i / iSeg);
    }
  }

  return [vertex, texture];
}
