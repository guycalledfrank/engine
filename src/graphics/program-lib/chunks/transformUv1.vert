uniform vec4 uvScaleOffset;

mat4 getModelMatrix(inout vsInternalData data) {
    return matrix_model;
}
vec4 getPosition(inout vsInternalData data) {
    data.modelMatrix = getModelMatrix(data);
    vec4 posW = data.modelMatrix * vec4(vertex_position, 1.0);
    data.positionW = posW.xyz;
    //vec2 uv = (vertex_texCoord1.xy * uvScaleOffset.xy + uvScaleOffset.zw) * 2.0 - 1.0;
    //uv = clamp(uv, vec2(-1.0), vec2(1.0));
    vec2 uv = vertex_texCoord1.xy * 2.0 - 1.0;
    return vec4(uv, 0.5, 1);
}
vec3 getWorldPosition(inout vsInternalData data) {
    return data.positionW;
}

