varying vec2 vUv0;
uniform sampler2D source;
uniform vec2 pixelOffset;
void main(void) {

    const float threshold = 0.0;

    vec4 c = texture2D(source, vUv0);
    if (c.a > 0.0) {
        gl_FragColor = c;
    } else {
        float weight = 0.0;

        vec4 c2 = texture2D(source, vUv0 - pixelOffset);
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + vec2(0, -pixelOffset.y));
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + vec2(pixelOffset.x, -pixelOffset.y));
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + vec2(-pixelOffset.x, 0));
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + vec2(pixelOffset.x, 0));
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + vec2(-pixelOffset.x, pixelOffset.y));
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + vec2(0, pixelOffset.y));
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        c2 = texture2D(source, vUv0 + pixelOffset);
        if (c2.a > threshold) {
            c += c2;
            weight += 1.0;
        }

        gl_FragColor = (c / max(weight,1.0));
    }
}

