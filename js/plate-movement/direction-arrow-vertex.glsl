attribute float size;
attribute float angle;
varying float vAngle;
attribute vec3 customColor;
attribute vec3 direction;
varying vec4 vColor;

void main() {
    vColor = vec4(0.0,  // R
                      0.0,  // G
                      1.0,  // B
                      1.0); // A    vec4(customColor, size > 0.0 ? 0.8 : 0.0);
    vAngle = angle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 40.0;//50.0;//size; // to scale: * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}