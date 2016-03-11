float getLightDiffuse(inout psInternalData data) {
    data.diffuseLight += -data.lightDirNormW * data.atten;
    data.alpha += data.atten;
    return 0.0;
}

