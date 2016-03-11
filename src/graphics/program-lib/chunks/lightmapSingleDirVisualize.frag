uniform sampler2D texture_lightMapDir;
void addLightMap(inout psInternalData data) {
    vec4 dir = texture2D(texture_lightMapDir, $UV);
    data.diffuseLight += dir.xyz * 2 - 1;
    data.alpha += dir.w;
}

