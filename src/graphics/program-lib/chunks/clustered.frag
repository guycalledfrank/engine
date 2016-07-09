
vec2 screenTC = gl_FragCoord.xy * uScreenSize.zw;
vec4 tileData = texture2D(texture_tile, screenTC);
int loffset = int(tileData.x);
int lcount = int(tileData.y);

const int MAX_LIGHTS_PER_TILE = 8;

for(int i=0; i<MAX_LIGHTS_PER_TILE; i++) {
    if (i==lcount) break;
    vec4 lightData = texture2D(texture_light, vec2((float(loffset + i)+0.5)/4096.0, 0));
    vec3 lightPos = lightData.xyz;
    float lightRadius = lightData.w;

    getLightDirPoint(lightPos);
    dAtten = getFalloffLinear(lightRadius);
    dAtten *= getLightDiffuse();
    dDiffuseLight += dAtten * light0_color;
}

//dDiffuseLight.r = float(loffset)/4096.0;

/*    getLightDirPoint(light0_position);
    dAtten = getFalloffLinear(light0_radius);
    dAtten *= getLightDiffuse();
    dDiffuseLight = dAtten * light0_color * tileData.x;*/
dDiffuseLight.r = float(lcount);//!=0? 1.0 : 0.0;

