uniform sampler2D texture_lightMap;
uniform sampler2D texture_lightMapDir;
void addLightMap(inout psInternalData data) {
    data.diffuseLight += $texture2DSAMPLE(texture_lightMap, $UV).$CH;

    vec4 dir = texture2D(texture_lightMapDir, $UV);
    vec3 lightDir = normalize(dir.xyz * 2.0 - vec3(1.0));

    vec3 h = normalize( lightDir + data.viewDirW );
    float nh = max( dot( h, data.normalW ), 0.0 );

    float specPow = exp2(data.glossiness * 11.0) * 32.0; // glossiness is linear, power is not; 0 - 2048
    specPow = antiAliasGlossiness(data, specPow);

    // Hack: On Mac OS X, calling pow with zero for the exponent generates hideous artifacts so bias up a little
    specPow = max(specPow, 0.0001);

    //data.diffuseLight = dir.rgb;

    data.diffuseLight = vec3(pow(nh, specPow) * (specPow + 2.0) / 8.0) * dir.w * 1.0;

    //data.reflection.rgb += ((pow(nh, specPow) * (specPow + 2.0) / 8.0) * dir.w) * data.diffuseLight * 4.0;
}

