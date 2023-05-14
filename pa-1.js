const isLeft = (type) => type === 'left';

const getFrustum =
  (frustumType) =>
  ({ eyeSeparation, convergence, aspectRatio, fov, near, far }) => {
    const top = near * Math.tan(fov / 2);
    const bottom = -top;

    const a = Math.tan(fov / 2) * convergence;
    const b = a - eyeSeparation / 2;
    const c = a + eyeSeparation / 2;

    const left = (isLeft(frustumType) ? -b * near : -c * near) / convergence;
    const right = (isLeft(frustumType) ? c * near : b * near) / convergence;

    return m4.orthographic(left, right, bottom, top, near, far);
  };

const drawWithFrustum = (drawType) => () => {
  const projection = getFrustum(drawType)(stereoCam);

  const modelView = spaceball.getViewMatrix();
  const rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0);

  const translateTo = m4.translation(drawType === 'left' ? -0.01 : 0.01, 0, -20);
  const matrixMultiplied = m4.multiply(rotateToPointZero, modelView);
  const matrix = m4.multiply(translateTo, matrixMultiplied);

  const matrixInverse = m4.inverse(matrix, new Float32Array(16));
  const normalMatrix = m4.transpose(matrixInverse, new Float32Array(16));

  const modelViewProjection = m4.multiply(projection, matrix);

  gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
  gl.uniformMatrix4fv(shProgram.iNormalMatrix, false, normalMatrix);

  surface.Draw();
};

const drawRight = drawWithFrustum('right');
const drawLeft = drawWithFrustum('left');
