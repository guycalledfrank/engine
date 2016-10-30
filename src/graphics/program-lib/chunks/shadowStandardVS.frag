float getShadowHardVS(sampler2D shadowMap, vec3 shadowParams) {
    float depth = unpackFloat(texture2DProj(shadowMap, vMainShadowUv));
    return (depth < min(vMainShadowUv.z + shadowParams.z, 1.0)) ? 0.0 : 1.0;
}

float getShadowPCF3x3VS(sampler2D shadowMap, vec3 shadowParams) {
    dShadowCoord = vMainShadowUv.xyz;

    dShadowCoord.z += getShadowBias(shadowParams.x, shadowParams.z);

    dShadowCoord.xyz /= vMainShadowUv.w;
    dShadowCoord.z = min(dShadowCoord.z, 1.0);
    return _getShadowPCF3x3(shadowMap, shadowParams);
}

