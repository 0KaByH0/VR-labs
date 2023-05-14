const createSurfaceData = () => {
  let vertexList = [];
  let textCoords = [];

  const scale = 1;

  const U_END = 360;
  const V_END = 50;
  const a = 1;
  const b = 1;
  const n = 1;

  const step = 1;

  const calculateUv = (u, v) => [u / U_END, (v + 1) / V_END + 1];
  for (let u = 0; u < U_END; u += step) {
    for (let v = -1; v < V_END; v += step) {
      const vRad = deg2rad(v);
      const uRad = deg2rad(u);

      const x = (a + b * Math.sin(n * uRad)) * Math.cos(uRad) - vRad * Math.sin(uRad);
      const y = (a + b * Math.sin(n * uRad)) * Math.sin(uRad) + vRad * Math.cos(uRad);
      const z = b * Math.cos(n * uRad);

      vertexList.push(x * scale, y * scale, z * scale);
      textCoords.push(...calculateUv(u, v));

      const vRadNext = deg2rad(v + step);
      const uRadNext = deg2rad(u + step);

      const x1 =
        (a + b * Math.sin(n * uRadNext)) * Math.cos(uRadNext) - vRadNext * Math.sin(uRadNext);
      const y1 =
        (a + b * Math.sin(n * uRadNext)) * Math.sin(uRadNext) + vRadNext * Math.cos(uRadNext);
      const z1 = b * Math.cos(n * uRadNext);

      vertexList.push(x1 * scale, y1 * scale, z1 * scale);
      textCoords.push(...calculateUv(u, v));
    }
  }

  return [vertexList, textCoords];
};
