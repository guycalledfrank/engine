#extension GL_EXT_shader_texture_lod : enable

uniform samplerCube texture_prefilteredCubeMap128;
uniform samplerCube texture_invBiasCubeMap;
uniform float material_reflectionFactor;

void addReflection(inout psInternalData data) {

    float bias = saturate(1.0 - data.glossiness) * 5.0; // multiply by max mip level
    vec3 fixedReflDir = data.reflDirW;//fixSeams(cubeMapProject(data.reflDirW), bias);
    fixedReflDir.x *= -1.0;

    float invBias = textureCube(texture_invBiasCubeMap, fixedReflDir).r * 255.0;
    bias -= invBias;
    //float invBiasClose = textureCube(texture_invBiasCubeMap, fixedReflDir, bias).r * 255.0;
    //float weirdDiff = bias - invBiasClose;
    //bias += -invBias + weirdDiff * 2.0;
    vec3 refl = processEnvironment($DECODE( textureCube(texture_prefilteredCubeMap128, fixedReflDir, bias) ).rgb);
    //vec3(invBias/8.0, invBiasClose/8.0, processEnvironment($DECODE( textureCube(texture_prefilteredCubeMap128, fixedReflDir, bias) ).rgb).r);

    data.reflection += vec4(refl, material_reflectionFactor);
}

