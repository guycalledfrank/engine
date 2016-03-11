uniform sampler2D texture_lightMapDir;
void addLightMap(inout psInternalData data) {
    data.diffuseLight += $texture2DSAMPLE(texture_lightMapDir, $UV).$CH;
}

