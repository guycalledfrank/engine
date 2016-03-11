float getLightDiffuse(inout psInternalData data) {

    //data.atten = min(data.atten * 2.0, 1.0);
    //data.diffuseLight = data.diffuseLight * data.alpha + -data.lightDirNormW * data.atten;
    //data.alpha = abs(data.alpha - data.atten);

    float lightA = data.alpha;
    float lightB = data.atten;
    float fade = 0.5;
    float f = saturate((lightB - lightA) / fade + 1.0);
    data.diffuseLight = mix(data.diffuseLight, -data.lightDirNormW, f);
    data.alpha = mix(data.alpha, data.atten, f);
    //data.alpha = abs(data.alpha - data.atten);

    //data.diffuseLight = mix(data.diffuseLight, -data.lightDirNormW, data.atten);
    //data.alpha = max(data.alpha, data.atten);

    //data.diffuseLight = data.atten>data.alpha? -data.lightDirNormW : data.diffuseLight;
    //data.alpha = data.atten>data.alpha? data.atten : data.alpha;

    return 0.0;
}

