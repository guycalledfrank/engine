uniform sampler2D texture_lightMap;
uniform sampler2D texture_lightMapDir;
void addLightMap(inout psInternalData data) {
    data.diffuseLight += $texture2DSAMPLE(texture_lightMap, $UV).$CH;

    vec4 dir = texture2D(texture_lightMapDir, $UV);
    data.diffuseLight = dir.xyz;
}

