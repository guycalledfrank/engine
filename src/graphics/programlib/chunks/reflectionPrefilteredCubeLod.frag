#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

uniform samplerCube texture_prefilteredCubeMap128;
uniform samplerCube texture_invBiasCubeMap;
uniform float material_reflectionFactor;

void addReflection(inout psInternalData data) {

    float bias = saturate(1.0 - data.glossiness) * 5.0; // multiply by max mip level
    vec3 fixedReflDir = data.reflDirW;//fixSeams(cubeMapProject(data.reflDirW), bias);
    fixedReflDir.x *= -1.0;

    float invBias = textureCube(texture_invBiasCubeMap, fixedReflDir).r * 255.0;
    //bias = 0.0;
    //bias -= invBias;
    //float invBiasClose = textureCube(texture_invBiasCubeMap, fixedReflDir, bias).r * 255.0;
    //float weirdDiff = bias - invBiasClose;
    //bias += -invBias + weirdDiff * 2.0;
    //vec3 refl = processEnvironment($DECODE( textureCube(texture_prefilteredCubeMap128, fixedReflDir, bias) ).rgb);
    //vec3(invBias/8.0, invBiasClose/8.0, processEnvironment($DECODE( textureCube(texture_prefilteredCubeMap128, fixedReflDir, bias) ).rgb).r);


    vec3 tc = normalize(fixedReflDir);
    vec3 tcAbs = abs(tc);
    /*if ((tcAbs.x > tcAbs.y) && (tcAbs.x > tcAbs.z)) {
        tc = tc.zyx;
    } else if ((tcAbs.y > tcAbs.x) && (tcAbs.y > tcAbs.z)) {
        tc = tc.zxy;
    }*/
    tc.z = max(max(tcAbs.x, tcAbs.y), tcAbs.z);
    vec2 uv = 0.5 * (tc.xy / tc.z + vec2(1.0));

    vec2 dx = dFdx(uv * 128.0);
    vec2 dy = dFdy(uv * 128.0);

    fixedReflDir = normalize(fixedReflDir) * (abs(tc.z) * bias);
    vec3 dx3 = dFdx(fixedReflDir * 128.0);
    vec3 dy3 = dFdy(fixedReflDir * 128.0);

    float dmax = max(dot(dx, dx), dot(dy, dy));
    float dmax2 = max(dot(dx3, dx3), dot(dy3, dy3));
    //dmax = min(dmax, dmax2);
    float currentMip = 0.5 * log2(dmax2);

    //currentMip += tc.z * 0.5;

    //float bitch = (1.0 - ((1.0 - 1.0/8.0) * (1.0 - tc.z/8.0))) * 8.0;
    //currentMip = min(invBias, currentMip);

    //vec3 refl = vec3(tc.z);
    //vec3 refl = textureCube(texture_invBiasCubeMap, fixedReflDir, -currentMip + bias).rrr*255.0/8.0;
    vec3 refl = vec3(processEnvironment($DECODE( textureCube(texture_prefilteredCubeMap128, fixedReflDir, -currentMip + bias) ).rgb));
    //uv.x, uv.y, 0.0);
    //saturate(currentMip/8.0));
    //invBias/8.0);
    //processEnvironment($DECODE( textureCubeLodEXT(texture_prefilteredCubeMap128, fixedReflDir, bias) ).rgb));

    data.reflection += vec4(refl, material_reflectionFactor);
}

