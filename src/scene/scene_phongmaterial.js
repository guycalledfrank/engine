pc.extend(pc, function () {

    var _tempTiling = new pc.Vec3();
    var _tempOffset = new pc.Vec3();

    /**
     * @name pc.PhongMaterial
     * @class A Phong material is the main, general purpose material that is most often used for rendering.
     * It can approximate a wide variety of surface types and can simlulate dynamic reflected light.
     * @property {pc.Color} ambient The ambient color of the material. This color value is 3-component (RGB),
     * where each component is between 0 and 1.
     * @property {pc.Color} diffuse The diffuse color of the material. This color value is 3-component (RGB),
     * where each component is between 0 and 1.
     * @property {pc.Texture} diffuseMap The diffuse map of the material. This must be a 2D texture rather
     * than a cube map. If this property is set to a valid texture, the texture is used as the source for diffuse
     * color in preference to the 'diffuse' property.
     * @property {pc.Vec2} diffuseMapTiling Controls the 2D tiling of the diffuse map.
     * @property {pc.Vec2} diffuseMapOffset Controls the 2D offset of the diffuse map. Each component is between 0 and 1.
     * @property {pc.Color} specular The specular color of the material. This color value is 3-component (RGB),
     * @property {pc.Texture} specularMap The per-pixel specular map of the material. This must be a 2D texture
     * rather than a cube map. If this property is set to a valid texture, the texture is used as the source for
     * specular color in preference to the 'specular' property.
     * @property {pc.Vec2} specularMapTiling Controls the 2D tiling of the specular map.
     * @property {pc.Vec2} specularMapOffset Controls the 2D offset of the specular map. Each component is between 0 and 1.
     * @property {Number} metalness Defines how much the surface is metallic. From 0 (dielectric) to 1 (metal).
     * This can be used as alternative to specular color to save space.
     * Metallic surfaces have their reflection tinted with diffuse color.
     * @property {pc.Texture} metalnessMap Monochrome metalness map.
     * @property {Boolean} useMetalness Use metalness properties instead of specular.
     * @property {Number} shininess Defines glossiness of the material from 0 (rough) to 100 (mirror).
     * A higher shininess value results in a more focussed specular highlight.
     * @property {pc.Texture} glossMap The per-pixel gloss of the material. This must be a 2D texture
     * rather than a cube map. If this property is set to a valid texture, the texture is used as the source for
     * shininess in preference to the 'shininess' property.
     * @property {pc.Vec2} glossMapTiling Controls the 2D tiling of the gloss map.
     * @property {pc.Vec2} glossMapOffset Controls the 2D offset of the gloss map. Each component is between 0 and 1.
     * @property {Number} refraction Defines the visibility of refraction. Material can refract the same cube map as used for reflections.
     * @property {Number} refractionIndex Defines the index of refraction, i.e. the amount of distortion.
     * The value is calculated as (outerIor / surfaceIor), where inputs are measured indices of refraction, the one around the object and the one of it's own surface.
     * In most situations outer medium is air, so outerIor will be approximately 1. Then you only need to do (1.0 / surfaceIor).
     * @property {pc.Vec3} emissive The emissive color of the material. This color value is 3-component (RGB),
     * where each component is between 0 and 1.
     * @property {pc.Texture} emissiveMap The emissive map of the material. This must be a 2D texture rather
     * than a cube map. If this property is set to a valid texture, the texture is used as the source for emissive
     * color in preference to the 'emissive' property.
     * @property {Number} emissiveIntensity Emissive color multiplier.
     * @property {pc.Vec2} emissiveMapTiling Controls the 2D tiling of the emissive map.
     * @property {pc.Vec2} emissiveMapOffset Controls the 2D offset of the emissive map. Each component is between 0 and 1.
     * @property {Number} opacity The opacity of the material. This value can be between 0 and 1, where 0 is fully
     * transparent and 1 is fully opaque. If you want the material to be transparent you also need to
     * set the {@link pc.PhongMaterial#blendType} to pc.BLEND_NORMAL or pc.BLEND_ADDITIVE.
     * @property {pc.Texture} opacityMap The opacity map of the material. This must be a 2D texture rather
     * than a cube map. If this property is set to a valid texture, the texture is used as the source for opacity
     * in preference to the 'opacity' property. If you want the material to be transparent you also need to
     * set the {@link pc.PhongMaterial#blendType} to pc.BLEND_NORMAL or pc.BLEND_ADDITIVE.
     * @property {pc.Vec2} opacityMapTiling Controls the 2D tiling of the opacity map.
     * @property {pc.Vec2} opacityMapOffset Controls the 2D offset of the opacity map. Each component is between 0 and 1.
     * @property {Number} blendType The type of blending for this material. Can be one of the following valus: pc.BLEND_NONE, pc.BLEND_NORMAL, pc.BLEND_ADDITIVE.
     * @property {pc.Texture} normalMap The normal map of the material. This must be a 2D texture rather
     * than a cube map. The texture must contains normalized, tangent space normals.
     * @property {pc.Vec2} normalMapTiling Controls the 2D tiling of the normal map.
     * @property {pc.Vec2} normalMapOffset Controls the 2D offset of the normal map. Each component is between 0 and 1.
     * @property {pc.Texture} heightMap The height map of the material. This must be a 2D texture rather
     * than a cube map. The texture contain values defining the height of the surface at that point where darker
     * pixels are lower and lighter pixels are higher.
     * @property {pc.Vec2} heightMapTiling Controls the 2D tiling of the height map.
     * @property {pc.Vec2} heightMapOffset Controls the 2D offset of the height map. Each component is between 0 and 1.
     * @property {Number} bumpiness The bumpiness of the material. This value scales the assigned normal map
     * and can be between 0 and 1, where 0 shows no contribution from the normal map and 1 results in a full contribution.
     * @property {Number} heightMapFactor Height map multiplier. Height maps are used to create a parallax mapping effect
     * and modifying this value will alter the strength of the parallax effect.
     * @property {pc.Texture} sphereMap The spherical environment map of the material.
     * @property {pc.Texture} cubeMap The cubic environment map of the material.
     * @property {Number} reflectivity The reflectivity of the material. This value scales the reflection map and
     * can be between 0 and 1, where 0 shows no reflection and 1 is fully reflective.
     * @property {pc.Texture} lightMap The light map of the material. This must be a 2D texture rather
     * than a cube map.
     * @property {Boolean} ambientTint Enables scene ambient multiplication by material ambient color.
     * @property {Boolean} diffuseMapTint Enables diffuseMap multiplication by diffuse color.
     * @property {Boolean} specularMapTint Enables specularMap multiplication by specular color.
     * @property {Boolean} emissiveMapTint Enables emissiveMap multiplication by emissive color.
     * @property {pc.Texture} aoMap Baked ambient occlusion map. Modulates ambient color.
     * @property {Boolean} occludeSpecular Uses aoMap to occlude specular/reflection. It's a hack, because real specular occlusion is view-dependent. However, it's much better than nothing.
     * @property {Number} occludeSpecularIntensity Controls visibility of specular occlusion.
     * @property {Number} occludeSpecularContrast Controls contrast of specular occlusion.
     * @property {Boolean} specularAntialias Enables Toksvig AA for mipmapped normal maps with specular.
     * @property {Boolean} conserveEnergy Defines how diffuse and specular components are combined when Fresnel is on.
        It is recommended that you leave this option enabled, although you may want to disable it in case when all reflection comes only from a few light sources, and you don't use an environment map, therefore having mostly black reflection.
     * @property {Number} shadingModel Defines the shading model.
     * <ul>
     * <li><strong>{@link pc.SPECULAR_PHONG}</strong>: Phong without energy conservation. You should only use it as a backwards compatibility with older projects.</li>
     * <li><strong>{@link pc.SPECULAR_BLINN}</strong>: Energy-conserving Blinn-Phong.</li>
     * </ul>
     * @property {Number} fresnelModel Defines the formula used for Fresnel effect.
     As a side-effect, enabling any Fresnel model changes the way diffuse and reflection components are combined.
     When Fresnel is off, legacy non energy-conserving combining is used. When it is on, combining behaviour is defined by conserveEnergy parameter.
     * <ul>
     * <li><strong>{@link pc.FRESNEL_NONE}</strong>: No Fresnel.</li>
     * <li><strong>{@link pc.FRESNEL_SIMPLE}</strong>: Fake effect resembling Fresnel with formula pow(dotVN, fresnelFactor). Use fresnelFactor to tweak effect power</li>
     * <li><strong>{@link pc.FRESNEL_SCHLICK}</strong>: Schlick's approximation of Fresnel (recommended). Parameterized by specular color. fresnelFactor is not used.</li>
     * <li><strong>{@link pc.FRESNEL_COMPLEX}</strong>: More complex Fresnel formula. Use fresnelFactor to specify IOR values.</li>
     * </ul>
     * @property {Number} fresnelFactor A parameter for Fresnel. May mean different things depending on fresnelModel.
     * @author Will Eastcott and Arthur Rahteenko
     */
    var PhongMaterial = function () {
        this.reset();
        this.update();
    };

    var _createTexture = function (param) {
        if (param.data) {
            if (param.data instanceof pc.Texture) {
                return param.data;
            } else {
                throw Error("PhongMaterial.init() expects textures to already be created");
            }
        } else {
            return null;
        }
    };

    var _createVec2 = function (param) {
        return new pc.Vec2(param.data[0], param.data[1]);
    };

    var _createVec3 = function (param) {
        return new pc.Vec3(param.data[0], param.data[1], param.data[2]);
    };

    var _createRgb = function (param) {
        return new pc.Color(param.data[0], param.data[1], param.data[2]);
    };

    var _beginProperties = function (obj) { // save all properties objest initially had to filter them out later
        if (!pc._matSerialProps) {
            obj._tempProps = [];
            for(var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    obj._tempProps[p] = true;
                }
            }
        }
    };

    var _endProperties = function (obj) { // capture all newly added properties
        if (!pc._matSerialProps) {
            pc._matSerialProps = [];
            for(var p in obj) {
                if (obj.hasOwnProperty(p) && !obj._tempProps[p]) {
                    pc._matSerialProps.push(p);
                }
            }
        }
    };

    var _defineTex2D = function (obj, name, uv, channels) {
        obj[name + "Map"] = null;
        obj[name + "MapTiling"] = new pc.Vec2(1, 1);
        obj[name + "MapOffset"] = new pc.Vec2(0, 0);
        obj[name + "MapTransform"] = null;

        obj[name + "MapUv"] = uv;
        if (channels > 0) obj[name + "MapChannel"] = channels > 1? "rgb" : "g";
        obj[name + "MapVertexColor"] = false;

        if (!pc._matTex2D) pc._matTex2D = [];
        pc._matTex2D[name] = channels;
    };

    PhongMaterial = pc.inherits(PhongMaterial, pc.Material);

    pc.extend(PhongMaterial.prototype, {

        reset: function () {

            _beginProperties(this);

            this.ambient = new pc.Color(0.7, 0.7, 0.7);
            this.diffuse = new pc.Color(1, 1, 1);
            this.specular = new pc.Color(0, 0, 0);
            this.shininess = 25;
            this.emissive = new pc.Color(0, 0, 0);
            this.opacity = 1;
            this.blendType = pc.BLEND_NONE;
            this.bumpiness = 1;
            this.heightMapFactor = 1;

            _defineTex2D(this, "diffuse", 0, 3);
            _defineTex2D(this, "specular", 0, 3);
            _defineTex2D(this, "emissive", 0, 3);
            _defineTex2D(this, "normal", 0, -1);
            _defineTex2D(this, "metalness", 0, 1);
            _defineTex2D(this, "gloss", 0, 1);
            _defineTex2D(this, "opacity", 0, 1);
            _defineTex2D(this, "height", 0, 1);
            _defineTex2D(this, "ao", 0, 1);
            _defineTex2D(this, "light", 1, 3);

            this.cubeMap = null;
            this.sphereMap = null;
            this.reflectivity = 1;

            this.aoUvSet = 0; // backwards comp
            this.blendMapsWithColors = true;

            this.specularAntialias = false;
            this.conserveEnergy = true;
            this.occludeSpecular = true;
            this.occludeSpecularContrast = 1;
            this.occludeSpecularIntensity = 1;
            this.shadingModel = pc.SPECULAR_PHONG;
            this.fresnelModel = pc.FRESNEL_NONE;

            this.fresnelFactor = 0;

            this.ambientTint = false;
            this.diffuseMapTint = false;
            this.specularMapTint = false;
            this.emissiveMapTint = false;
            this.emissiveIntensity = 1;
            this.normalizeNormalMap = true;
            this.fastTbn = false;

            this.useInstancing = false;
            this.cubeMapProjection = 0;
            this.cubeMapProjectionBox = null;

            this.chunks = {};
            this.chunks.copy = function(from) {
                for(var p in from) {
                    if (from.hasOwnProperty(p) && p!=="copy") {
                        this[p] = from[p];
                    }
                }
            };
            this.customFragmentShader = null;
            this.refraction = 0;
            this.refractionIndex = 1.0 / 1.5; // approx. (air ior / glass ior)
            this.useMetalness = false;
            this.metalness = 1;

            this.shadowSampleType = pc.SHADOWSAMPLE_PCF3X3;

            this.forceFragmentPrecision = null;
            this.occludeDirect = false;

            this.prefilteredCubeMap128 = null;
            this.prefilteredCubeMap64 = null;
            this.prefilteredCubeMap32 = null;
            this.prefilteredCubeMap16 = null;
            this.prefilteredCubeMap8 = null;
            this.prefilteredCubeMap4 = null;

            _endProperties(this);

            // Array to pass uniforms to renderer
            this.ambientUniform = new Float32Array(3);
            this.diffuseUniform = new Float32Array(3);
            this.specularUniform = new Float32Array(3);
            this.emissiveUniform = new Float32Array(3);
            this.cubeMapMinUniform = new Float32Array(3);
            this.cubeMapMaxUniform = new Float32Array(3);
        },


        /**
         * @function
         * @name pc.PhongMaterial#clone
         * @description Duplicates a Phong material. All properties are duplicated except textures
         * where only the references are copied.
         * @returns {pc.PhongMaterial} A cloned Phong material.
         */
        clone: function () {
            var clone = new pc.PhongMaterial();

            pc.Material.prototype._cloneInternal.call(this, clone);

            var pname;
            for(var i=0; i<pc._matSerialProps.length; i++) {
                pname = pc._matSerialProps[i];
                if (this[pname]!==undefined) {
                    if (this[pname] && this[pname].copy) {
                        clone[pname].copy(this[pname]);
                    } else {
                        clone[pname] = this[pname];
                    }
                }
            }

            clone.update();
            return clone;
        },

        /**
        * @private
        * @name pc.PhoneMaterial#init
        * @description Update material data from a data block, as found on a material Asset.
        * Note, init() expects texture parameters to contain a {@link pc.Texture} not a resource id.
        */
        init: function (data) {
            this.reset();

            // Initialise material from data
            this.name = data.name;

            for (var i = 0; i < data.parameters.length; i++) {
                var param = data.parameters[i];
                if (param.type === "vec3") {
                    this[param.name] = _createRgb(param);
                } else if (param.type === "vec2") {
                    this[param.name] = _createVec2(param);
                } else if (param.type === "texture") {
                    this[param.name] = _createTexture(param);
                } else if (param.name === "bumpMapFactor") { // Unfortunately, names don't match for bumpiness
                    this.bumpiness = param.data;
                } else {
                    this[param.name] = param.data;
                }
            }

            this.update();
        },

        _updateMapTransform: function (transform, tiling, offset) {
            transform = transform || new pc.Vec4();
            transform.set(tiling.x, tiling.y, offset.x, offset.y);

            if ((transform.x==1) && (transform.y==1) && (transform.z==0) && (transform.w==0)) return null;
            return transform;
        },

        _collectLights: function(lType, lights, lightsSorted, mask) {
            for (var i = 0; i < lights.length; i++) {
                if (lights[i].getEnabled()) {
                    if (lights[i].mask & mask) {
                        if (lights[i].getType()==lType) {
                            lightsSorted.push(lights[i]);
                        }
                    }
                }
            }
        },

        _updateMap: function (p) {
            var mname = p + "Map";
            if (this[mname]) {
                this.setParameter("texture_" + mname, this[mname]);

                var tname = mname + "Transform";
                this[tname] = this._updateMapTransform(
                    this[tname],
                    this[mname + "Tiling"],
                    this[mname + "Offset"]
                );

                if (this[tname]) {
                    this.setParameter('texture_' + tname, this[tname].data);
                }
            }
        },

        update: function () {
            this.clearParameters();

            this.ambientUniform[0] = this.ambient.r;
            this.ambientUniform[1] = this.ambient.g;
            this.ambientUniform[2] = this.ambient.b;
            this.setParameter('material_ambient', this.ambientUniform);

            if (!this.diffuseMap || this.diffuseMapTint) {
                this.diffuseUniform[0] = this.diffuse.r;
                this.diffuseUniform[1] = this.diffuse.g;
                this.diffuseUniform[2] = this.diffuse.b;
                this.setParameter('material_diffuse', this.diffuseUniform);
            }

            if (!this.useMetalness) {
                if (!this.specularMap || this.specularMapTint) {
                    this.specularUniform[0] = this.specular.r;
                    this.specularUniform[1] = this.specular.g;
                    this.specularUniform[2] = this.specular.b;
                    this.setParameter('material_specular', this.specularUniform);
                }
            } else {
                if (!this.metalnessMap || this.metalness<1) {
                    this.setParameter('material_metalness', this.metalness);
                }
            }

            // Shininess is 0-100 value
            // which is actually a 0-1 glosiness value.
            // Can be converted to specular power using exp2(shininess * 0.01 * 11)
            if (this.shadingModel===pc.SPECULAR_PHONG) {
                this.setParameter('material_shininess', Math.pow(2, this.shininess * 0.01 * 11)); // legacy: expand back to specular power
            } else {
                this.setParameter('material_shininess', this.shininess * 0.01); // correct
            }

            if (!this.emissiveMap || this.emissiveMapTint) {
                this.emissiveUniform[0] = this.emissive.r * this.emissiveIntensity;
                this.emissiveUniform[1] = this.emissive.g * this.emissiveIntensity;
                this.emissiveUniform[2] = this.emissive.b * this.emissiveIntensity;
                this.setParameter('material_emissive', this.emissiveUniform);
            }

            if (this.refraction>0) {
                this.setParameter('material_refraction', this.refraction);
                this.setParameter('material_refractionIor', this.refractionIndex);
            }

            this.setParameter('material_opacity', this.opacity);

            if (this.occludeSpecular) {
                this.setParameter('material_occludeSpecularIntensity', this.occludeSpecularIntensity);
                if (this.occludeSpecularContrast > 0) {
                    this.setParameter('material_occludeSpecularContrast', this.occludeSpecularContrast);
                }
            }

            if (this.cubeMapProjection===pc.CUBEPROJ_BOX) {
                this.cubeMapMinUniform[0] = this.cubeMapProjectionBox.center.x - this.cubeMapProjectionBox.halfExtents.x;
                this.cubeMapMinUniform[1] = this.cubeMapProjectionBox.center.y - this.cubeMapProjectionBox.halfExtents.y;
                this.cubeMapMinUniform[2] = this.cubeMapProjectionBox.center.z - this.cubeMapProjectionBox.halfExtents.z;

                this.cubeMapMaxUniform[0] = this.cubeMapProjectionBox.center.x + this.cubeMapProjectionBox.halfExtents.x;
                this.cubeMapMaxUniform[1] = this.cubeMapProjectionBox.center.y + this.cubeMapProjectionBox.halfExtents.y;
                this.cubeMapMaxUniform[2] = this.cubeMapProjectionBox.center.z + this.cubeMapProjectionBox.halfExtents.z;

                this.setParameter('envBoxMin', this.cubeMapMinUniform);
                this.setParameter('envBoxMax', this.cubeMapMaxUniform);
            }

            var i = 0;

            this._updateMap("diffuse");
            this._updateMap("specular");
            this._updateMap("gloss");
            this._updateMap("emissive");
            this._updateMap("opacity");
            this._updateMap("normal");
            this._updateMap("metalness");
            this._updateMap("height");
            this._updateMap("light");
            this._updateMap("ao");

            if (this.normalMap) {
                this.setParameter('material_bumpMapFactor', this.bumpiness);
            }

            if (this.heightMap) {
                this.setParameter('material_heightMapFactor', this.heightMapFactor * 0.025);
            }

            if (this.cubeMap) {
                this.setParameter('texture_cubeMap', this.cubeMap);
            }
            if (this.prefilteredCubeMap128) {
                this.setParameter('texture_prefilteredCubeMap128', this.prefilteredCubeMap128);
            }
            if (this.prefilteredCubeMap64) {
                this.setParameter('texture_prefilteredCubeMap64', this.prefilteredCubeMap64);
            }
            if (this.prefilteredCubeMap32) {
                this.setParameter('texture_prefilteredCubeMap32', this.prefilteredCubeMap32);
            }
            if (this.prefilteredCubeMap16) {
                this.setParameter('texture_prefilteredCubeMap16', this.prefilteredCubeMap16);
            }
            if (this.prefilteredCubeMap8) {
                this.setParameter('texture_prefilteredCubeMap8', this.prefilteredCubeMap8);
            }
            if (this.prefilteredCubeMap4) {
                this.setParameter('texture_prefilteredCubeMap4', this.prefilteredCubeMap4);
            }
            if (this.sphereMap) {
                this.setParameter('texture_sphereMap', this.sphereMap);
            }
            //if (this.sphereMap || this.cubeMap || this.prefilteredCubeMap128) {
                this.setParameter('material_reflectionFactor', this.reflectivity);
            //}

            if (this.fresnelFactor > 0) {
                this.setParameter('material_fresnelFactor', this.fresnelFactor);
            }

            this.shader = null;
            this.clearVariants();
        },

        _getMapTransformID: function(xform, uv) {
            if (!xform) return 0;
            if (!this._mapXForms[uv]) this._mapXForms[uv] = [];

            var i, j, same;
            for(i=0; i<this._mapXForms[uv].length; i++) {
                same = true;
                for(j=0; j<xform.data.length; j++) {
                    if (this._mapXForms[uv][i][j] != xform.data[j]) {
                        same = false;
                        break;
                    }
                }
                if (same) {
                    return i + 1;
                }
            }
            var newID = this._mapXForms[uv].length;
            this._mapXForms[uv][newID] = [];
            for(j=0; j<xform.data.length; j++) {
                this._mapXForms[uv][newID][j] = xform.data[j];
            }
            return newID + 1;
        },

        updateShader: function (device, scene, objDefs) {
            var i;
            var lights = scene._lights;

            this._mapXForms = [];

            var useTexCubeLod = device.useTexCubeLod;

            var prefilteredCubeMap128 = this.prefilteredCubeMap128 || scene.skyboxPrefiltered128;
            var prefilteredCubeMap64 = this.prefilteredCubeMap64 || scene.skyboxPrefiltered64;
            var prefilteredCubeMap32 = this.prefilteredCubeMap32 || scene.skyboxPrefiltered32;
            var prefilteredCubeMap16 = this.prefilteredCubeMap16 || scene.skyboxPrefiltered16;
            var prefilteredCubeMap8 = this.prefilteredCubeMap8 || scene.skyboxPrefiltered8;
            var prefilteredCubeMap4 = this.prefilteredCubeMap4 || scene.skyboxPrefiltered4;

            if (prefilteredCubeMap128) {
                var allMips = prefilteredCubeMap128 &&
                              prefilteredCubeMap64 &&
                              prefilteredCubeMap32 &&
                              prefilteredCubeMap16 &&
                              prefilteredCubeMap8 &&
                              prefilteredCubeMap4;

                //prefilteredCubeMap128.magFilter = pc.FILTER_NEAREST;
                //prefilteredCubeMap128.minFilter = pc.FILTER_NEAREST_MIPMAP_NEAREST;
                if (!device._invBiasCubemap) {
                    var tex = new pc.gfx.Texture(device, {
                        cubemap: true,
                        fixCubemapSeams: true,
                        autoMipmap: false,
                        format: pc.PIXELFORMAT_L8,
                        width: 128,
                        height: 128
                    });
                    tex.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
                    tex.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
                    //tex.magFilter = pc.FILTER_NEAREST;
                    //tex.minFilter = pc.FILTER_NEAREST_MIPMAP_NEAREST;
                    var res = 128;
                    var j;
                    for(i=0; i<8; i++) {
                        var arr = new Uint8Array(res * res);
                        for(j=0; j<res*res; j++) {
                            arr[j] = i;
                        }
                        tex._levels[i] = [arr, arr, arr, arr, arr, arr];
                        res /= 2;
                        res = Math.max(res, 4);
                    }
                    tex.upload();
                    device._invBiasCubemap = tex;
                }
                this.setParameter('texture_invBiasCubeMap', device._invBiasCubemap);

                if (useTexCubeLod) {
                    if (prefilteredCubeMap128._levels.length<6) {
                        if (allMips) {
                            // Multiple -> single (provided cubemap per mip, but can use texCubeLod)
                            this.setParameter('texture_prefilteredCubeMap128', prefilteredCubeMap128);
                        } else {
                            console.log("Can't use prefiltered cubemap: " + allMips + ", " + useTexCubeLod + ", " + prefilteredCubeMap128._levels);
                        }
                    } else {
                        // Single (able to use single cubemap with texCubeLod)
                        this.setParameter('texture_prefilteredCubeMap128', prefilteredCubeMap128);
                    }
                } else if (allMips) {
                    // Multiple (no texCubeLod, but able to use cubemap per mip)
                    this.setParameter('texture_prefilteredCubeMap128', prefilteredCubeMap128);
                    this.setParameter('texture_prefilteredCubeMap64', prefilteredCubeMap64);
                    this.setParameter('texture_prefilteredCubeMap32', prefilteredCubeMap32);
                    this.setParameter('texture_prefilteredCubeMap16', prefilteredCubeMap16);
                    this.setParameter('texture_prefilteredCubeMap8', prefilteredCubeMap8);
                    this.setParameter('texture_prefilteredCubeMap4', prefilteredCubeMap4);
                } else {
                    console.log("Can't use prefiltered cubemap: " + allMips + ", " + useTexCubeLod + ", " + prefilteredCubeMap128._levels);
                }
            }

            var specularTint = false;
            var useSpecular = (this.useMetalness? true : !!this.specularMap) || (!!this.sphereMap) || (!!this.cubeMap);
            useSpecular = useSpecular || (this.useMetalness? true : !(this.specular.r===0 && this.specular.g===0 && this.specular.b===0));

            if (useSpecular) {
                if (this.specularMapTint && !this.useMetalness) {
                    specularTint = this.specular.r!==1 || this.specular.g!==1 || this.specular.b!==1;
                }
            }

            var rgbmReflection = prefilteredCubeMap128? prefilteredCubeMap128.rgbm : (this.cubeMap? this.cubeMap.rgbm : (this.sphereMap? this.sphereMap.rgbm : false));

            var options = {
                fog:                        scene.fog,
                gamma:                      scene.gammaCorrection,
                toneMap:                    scene.toneMapping,
                blendMapsWithColors:        this.blendMapsWithColors,
                modulateAmbient:            this.ambientTint,
                diffuseTint:                (this.diffuse.r!=1 || this.diffuse.g!=1 || this.diffuse.b!=1) && this.diffuseMapTint,
                specularTint:               specularTint,
                metalnessTint:              this.useMetalness && this.metalness<1,
                glossTint:                  true,
                emissiveTint:               (this.emissive.r!=1 || this.emissive.g!=1 || this.emissive.b!=1 || this.emissiveIntensity!=1) && this.emissiveMapTint,
                opacityTint:                this.opacity!=1,
                needsNormalFloat:           this.normalizeNormalMap,

                sphereMap:                  !!this.sphereMap,
                cubeMap:                    !!this.cubeMap,
                useSpecular:                useSpecular,
                rgbmReflection:             rgbmReflection,

                hdrReflection:              prefilteredCubeMap128? prefilteredCubeMap128.rgbm || prefilteredCubeMap128.format===pc.PIXELFORMAT_RGBA32F
                                          : (this.cubeMap? this.cubeMap.rgbm || this.cubeMap.format===pc.PIXELFORMAT_RGBA32F
                                          : (this.sphereMap? this.sphereMap.rgbm || this.sphereMap.format===pc.PIXELFORMAT_RGBA32F : false)),

                fixSeams:                   prefilteredCubeMap128? prefilteredCubeMap128.fixCubemapSeams : (this.cubeMap? this.cubeMap.fixCubemapSeams : false),
                prefilteredCubemap:         !!prefilteredCubeMap128,
                emissiveFormat:             this.emissiveMap? (this.emissiveMap.rgbm? 1 : (this.emissiveMap.format===pc.PIXELFORMAT_RGBA32F? 2 : 0)) : null,
                lightMapFormat:             this.lightMap? (this.lightMap.rgbm? 1 : (this.lightMap.format===pc.PIXELFORMAT_RGBA32F? 2 : 0)) : null,
                useRgbm:                    rgbmReflection || (this.emissiveMap? this.emissiveMap.rgbm : 0) || (this.lightMap? this.lightMap.rgbm : 0),
                specularAA:                 this.specularAntialias,
                conserveEnergy:             this.conserveEnergy,
                occludeSpecular:            this.occludeSpecular,
                occludeSpecularFloat:      (this.occludeSpecularContrast > 0),
                occludeDirect:              this.occludeDirect,
                shadingModel:               this.shadingModel,
                fresnelModel:               this.fresnelModel,
                packedNormal:               this.normalMap? this.normalMap._compressed : false,
                shadowSampleType:           this.shadowSampleType,
                forceFragmentPrecision:     this.forceFragmentPrecision,
                useInstancing:              this.useInstancing,
                fastTbn:                    this.fastTbn,
                cubeMapProjection:          this.cubeMapProjection,
                chunks:                     this.chunks,
                customFragmentShader:       this.customFragmentShader,
                refraction:                 !!this.refraction,
                useMetalness:               this.useMetalness,
                blendType:                  this.blendType,
                skyboxIntensity:            (prefilteredCubeMap128===scene.skyboxPrefiltered128 && prefilteredCubeMap128) && (scene.skyboxIntensity!==1),
                useTexCubeLod:              useTexCubeLod
            };

            var hasUv1 = false;
            if (objDefs) {
                options.noShadow = (objDefs & pc.SHADERDEF_NOSHADOW) !== 0;
                options.skin = (objDefs & pc.SHADERDEF_SKIN) !== 0;
                hasUv1 = (objDefs & pc.SHADERDEF_UV1) !== 0;
            }

            for(var p in pc._matTex2D) {
                var mname = p + "Map";
                if (this[mname]) {
                    var uname = mname + "Uv";
                    var allow = true;
                    if (this[uname]===1 && !hasUv1) allow = false;
                    if (allow) {
                        options[mname] = !!this[mname];
                        var tname = mname + "Transform";
                        var cname = mname + "Channel";
                        options[tname] = this._getMapTransformID(this[tname], this[uname]);
                        options[cname] = this[cname];
                        options[uname] = this[uname];
                    }
                } else if (p!=="height") {
                    var vname = mname + "VertexColor";
                    if (this[vname]) {
                        var cname = mname + "Channel";
                        options[vname] = this[vname];
                        options[cname] = this[cname];
                        options.vertexColors = true;
                    }
                }
            }

            options.aoMapUv = options.aoMapUv || this.aoUvSet; // backwards comp

            this._mapXForms = null;

            var lightsSorted = [];
            var mask = objDefs? (objDefs >> 8) : 1;
            this._collectLights(pc.LIGHTTYPE_DIRECTIONAL, lights, lightsSorted, mask);
            this._collectLights(pc.LIGHTTYPE_POINT,       lights, lightsSorted, mask);
            this._collectLights(pc.LIGHTTYPE_SPOT,        lights, lightsSorted, mask);

            options.lights = lightsSorted;
            options.debug = true;

            // Gamma correct colors
            for(i=0; i<3; i++) {
                if (scene.gammaCorrection) {
                    this.ambientUniform[i] = Math.pow(this.ambient.data[i], 2.2);
                    this.diffuseUniform[i] = Math.pow(this.diffuse.data[i], 2.2);
                    this.specularUniform[i] = Math.pow(this.specular.data[i], 2.2);
                    this.emissiveUniform[i] = Math.pow(this.emissive.data[i], 2.2) * this.emissiveIntensity;
                } else {
                    this.ambientUniform[i] = this.ambient.data[i];
                    this.diffuseUniform[i] = this.diffuse.data[i];
                    this.specularUniform[i] = this.specular.data[i];
                    this.emissiveUniform[i] = this.emissive.data[i] * this.emissiveIntensity;
                }
            }

            var library = device.getProgramLibrary();
            this.shader = library.getProgram('phong', options);

            if (!objDefs) {
                this.clearVariants();
                this.variants[0] = this.shader;
            }
        }
    });

    return {
        PhongMaterial: PhongMaterial
    };
}());
