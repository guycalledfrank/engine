
gl_FragColor.rgb = normalize(data.diffuseLight) * 0.5 + vec3(0.5);
gl_FragColor.a = data.alpha;

