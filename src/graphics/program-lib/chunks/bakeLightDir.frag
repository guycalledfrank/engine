float getLightDiffuse(inout psInternalData data) {
    data.diffuseLight += -data.lightDirNormW * data.atten;
    return 0.0;
}

