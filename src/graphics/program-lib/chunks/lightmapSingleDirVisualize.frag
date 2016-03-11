uniform sampler2D texture_lightMap;
void addLightMap(inout psInternalData data) {
    vec4 dir = texture2D(texture_lightMap, $UV);
    data.diffuseLight = normalize(dir.xyz * 2.0 - vec3(1.0));
    data.alpha = dir.w;
}

