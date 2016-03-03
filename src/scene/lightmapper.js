pc.extend(pc, function () {

    var maxSize = 2048;
    var atlasSize = 1024;
    var maxAtlasableSize = 512;
    var maskDynamic = 1;
    var maskBaked = 2;
    var maskLightmap = 4;

    var sceneLightmaps = [];
    var sceneLightmapsNode = [];
    var lmCamera;
    var tempVec = new pc.Vec3();
    var bounds = new pc.BoundingBox();
    var lightBounds = new pc.BoundingBox();
    var rect = new pc.Vec4();
    var tempSphere = {};
    var lmMaterial;

    var forceTiling = new pc.Vec2(0.9,0.9);
    var forceOffset = new pc.Vec2(0,0);
    var identityMapTransform = new pc.Vec4(1,1,0,0);

    function collectModels(node, nodes, nodesMeshInstances, allNodes) {
        if (!node.enabled) return;

        var i;
        if (node.model && node.model.model) {
            if (allNodes) allNodes.push(node);
            if (node.model.data.lightmapped) {
                if (nodes) {
                    var hasUv1 = true;
                    var meshInstances = node.model.model.meshInstances;
                    for(i=0; i<meshInstances.length; i++) {
                        if (!meshInstances[i].mesh.vertexBuffer.format.hasUv1) {
                            hasUv1 = false;
                            break;
                        }
                    }
                    if (hasUv1) {

                        var j;
                        var isInstance;
                        var notInstancedMeshInstances = [];
                        for(i=0; i<meshInstances.length; i++) {
                            isInstance = false;
                            for(j=0; j<meshInstances.length; j++) {
                                if (i!==j) {
                                    if (meshInstances[i].mesh===meshInstances[j].mesh) {
                                        isInstance = true;
                                    }
                                }
                            }
                            // collect each instance (object with shared VB) as separate "node"
                            if (isInstance) {
                                nodes.push(node);
                                nodesMeshInstances.push([meshInstances[i]]);
                            } else {
                                notInstancedMeshInstances.push(meshInstances[i]);
                            }
                        }

                        // collect all non-shared objects as one "node"
                        if (notInstancedMeshInstances.length > 0) {
                            nodes.push(node);
                            nodesMeshInstances.push(notInstancedMeshInstances);
                        }
                    }
                }
            }
        }
        var children = node.getChildren();
        for(i=0; i<children.length; i++) {
            collectModels(children[i], nodes, nodesMeshInstances, allNodes);
        }
    }

    function fits(what, where) {
        return (what.z <= where.z && what.w <= where.w);
    }

    function fitsExactly(what, where) {
        return (what.z === where.z && what.w === where.w);
    }

    function insertToAtlas(node, id, aabb) {
        if (node.leaf) {
            if (node.id >= 0) {
                return null;
            }
            if (!fits(aabb, node.aabb)) return null;
            if (fitsExactly(aabb, node.aabb)) {
                node.id = id;
                return node;
            }
            var r0 = {x:0,y:0,z:0,w:0};
            var r1 = {x:0,y:0,z:0,w:0};
            var dw = node.aabb.z - aabb.z;
            var dh = node.aabb.w - aabb.w;
            if (dw > dh) {
                r0.x = node.aabb.x;
                r0.y = node.aabb.y;
                r0.z = aabb.z;
                r0.w = node.aabb.w;

                r1.x = node.aabb.x + aabb.z;
                r1.y = node.aabb.y;
                r1.z = node.aabb.z - aabb.z;
                r1.w = node.aabb.w;
            } else {
                r0.x = node.aabb.x;
                r0.y = node.aabb.y;
                r0.z = node.aabb.z;
                r0.w = aabb.w;

                r1.x = node.aabb.x;
                r1.y = node.aabb.y + aabb.w;
                r1.z = node.aabb.z;
                r1.w = node.aabb.w - aabb.w;
            }
            node.leaf = false;
            node.child = [];
            node.child[0] = {aabb:r0, id:-1, child:[], leaf:true};
            node.child[1] = {aabb:r1, id:-1, child:[], leaf:true};
            return insertToAtlas(node.child[0], id, aabb);
        } else {
            for(var i=0; i<node.child.length; i++) {
                var result = insertToAtlas(node.child[i], id, aabb);
                if (result) return result;
            }
            return null;
        }
    }

    function allocateTexture(device, size, stats, texPool, name) {
        var tex = new pc.Texture(device, {width:size,
                                      height:size,
                                      format:pc.PIXELFORMAT_R8_G8_B8_A8,
                                      autoMipmap:false,
                                      rgbm:true});
        tex.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
        tex.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
        tex._minFilter = pc.FILTER_LINEAR;
        tex._magFilter = pc.FILTER_LINEAR;

        stats.lightmapMem += size * size * 4 * 4;
        stats.lightmapCount++;

        tex.name = name;

        if (!texPool[size]) {
            var tex2 = new pc.Texture(device, {width:size,
                                      height:size,
                                      format:pc.PIXELFORMAT_R8_G8_B8_A8,
                                      autoMipmap:false,
                                      rgbm:true});
            tex2.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
            tex2.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
            tex2._minFilter = pc.FILTER_LINEAR;
            tex2._magFilter = pc.FILTER_LINEAR;
            tex2.name = "tmp" + size;
            var targ2 = new pc.RenderTarget(device, tex2, {
                depth: false
            });
            texPool[size] = targ2;
        }

        return tex;
    }


    var Lightmapper = function (device, root, scene, renderer, assets) {
        this.device = device;
        this.root = root;
        this.scene = scene;
        this.renderer = renderer;
        this.assets = assets;

        this._stats = {
            renderPasses: 0,
            lightmapCount: 0,
            lightmapMem: 0,
            renderTime: 0,
            shadersLinked: 0
        };
    };

    Lightmapper.prototype = {

        calculateLightmapSize: function(node, nodesMeshInstances) {
            var sizeMult = this.scene.lightmapSizeMultiplier || 1;
            var scale = tempVec;
            var parent;
            var area = {x:1, y:1, z:1, uv:1};

            if (node.model.asset) {
                var data = this.assets.get(node.model.asset).data;
                if (data.area) {
                    area.x = data.area.x;
                    area.y = data.area.y;
                    area.z = data.area.z;
                    area.uv = data.area.uv;
                }
            } else if (node.model._area) {
                var data = node.model;
                if (data._area) {
                    area.x = data._area.x;
                    area.y = data._area.y;
                    area.z = data._area.z;
                    area.uv = data._area.uv;
                }
            }
            var areaMult = node.model.lightmapSizeMultiplier || 1;
            area.x *= areaMult;
            area.y *= areaMult;
            area.z *= areaMult;

            scale.copy(node.getLocalScale());
            parent = node.getParent();
            while(parent) {
                scale.mul(parent.getLocalScale());
                parent = parent.getParent();
            }

            var totalArea = area.x * scale.y * scale.z +
                            area.y * scale.x * scale.z +
                            area.z * scale.x * scale.y;
            totalArea /= area.uv;
            totalArea = Math.sqrt(totalArea);

            return Math.min(pc.math.nextPowerOfTwo(totalArea * sizeMult), this.scene.lightmapMaxResolution || maxSize);
        },

        bake: function(nodes) {

            var startTime = pc.now();
            this.device.fire('lightmapper:start', {
                timestamp: startTime,
                target: this
            });

            var i, j, k;
            var id;
            var device = this.device;
            var scene = this.scene;
            var stats = this._stats;

            rect.z = atlasSize;
            rect.w = atlasSize;

            stats.renderPasses = 0;
            var startShaders = device._shaderStats.linked;

            var allNodes = [];
            var nodesMeshInstances = [];
            if (!nodes) {
                // ///// Full bake /////

                // delete old lightmaps, if present
                for(i=0; i<sceneLightmaps.length; i++) {
                    sceneLightmaps[i].destroy();
                }
                sceneLightmaps = [];
                sceneLightmapsNode = [];

                // collect
                nodes = [];
                collectModels(this.root, nodes, nodesMeshInstances, allNodes);
            } else {
                // ///// Selected bake /////

                // delete old lightmaps, if present
                for(i=0; i<sceneLightmaps.length; i++) {
                    for(i=j; j<nodes.length; j++) {
                        if (sceneLightmapsNode[i]===nodes[j]) sceneLightmaps[i].destroy();
                    }
                }
                sceneLightmaps = [];
                sceneLightmapsNode = [];

                // collect
                var _nodes = [];
                for(i=0; i<nodes.length; i++) {
                    collectModels(nodes[i], _nodes, nodesMeshInstances);
                }
                nodes = _nodes;

                collectModels(this.root, null, null, allNodes);
            }

            // Calculate lightmap sizes and allocate textures
            var texSize = [];
            var atlasableNodes = [];
            var lmaps = [];
            var texPool = {};
            var size;
            var tex;
            for(i=0; i<nodes.length; i++) {
                size = this.calculateLightmapSize(nodes[i], nodesMeshInstances[i]);
                texSize.push(size);

                if (size <= maxAtlasableSize) {
                    atlasableNodes.push(i);
                } else {
                    tex = allocateTexture(device, size, stats, texPool, "lm" + i);
                    lmaps[i] = tex;
                }
            }

            var currentAtlasId = 0;
            var texAtlasId = [];
            var texAtlasScaleOffset = [];
            var texAtlasCount = [];
            var texAtlasArea = [];
            atlasableNodes.sort(function(a, b){ // sort from larger to smaller
                return texSize[b] - texSize[a];
            });
            var root = {aabb:{x:0,y:0,z:atlasSize,w:atlasSize}, id:-1, child:[], leaf:true};
            texAtlasCount[0] = 0;
            texAtlasArea[0] = 0;
            var nodeId;
            var nodeAtlasObj;
            for(i=0; i<atlasableNodes.length; i++) {
                nodeId = atlasableNodes[i];
                nodeAtlasObj = insertToAtlas(root, i, {x:0,y:0,z:texSize[nodeId],w:texSize[nodeId]});
                if (!nodeAtlasObj) {
                    currentAtlasId++;
                    root = {aabb:{x:0,y:0,z:atlasSize,w:atlasSize}, id:-1, child:[], leaf:true};
                    texAtlasCount[currentAtlasId] = 0;
                    texAtlasArea[currentAtlasId] = 0;
                    nodeAtlasObj = insertToAtlas(root, i, {x:0,y:0,z:texSize[nodeId],w:texSize[nodeId]});
                }
                if (nodeAtlasObj) {
                    texAtlasId[nodeId] = currentAtlasId;
                    texAtlasScaleOffset[nodeId] =
                        new pc.Vec4(nodeAtlasObj.aabb.z/atlasSize, nodeAtlasObj.aabb.w/atlasSize, nodeAtlasObj.aabb.x/atlasSize, nodeAtlasObj.aabb.y/atlasSize);
                    texAtlasCount[currentAtlasId]++;
                    texAtlasArea[currentAtlasId] += texSize[nodeId] * texSize[nodeId];
                } else {
                    console.error("Error inserting to atlas");
                }
            }
            var fullArea = atlasSize * atlasSize;
            for(i=0; i<currentAtlasId+1; i++) {
                console.log("Added " + texAtlasCount[i] + " lightmaps into atlas " + i + ", used space: " + (((texAtlasArea[i]/fullArea))*100) + "%");
                tex = allocateTexture(device, atlasSize, stats, texPool, "atlasLM" + i);
                for(j=0; j<nodes.length; j++) {
                    if (texAtlasId[j]===i) {
                        lmaps[j] = tex;
                    }
                }
            }


            // Collect bakeable lights
            var lights = [];
            var origMask = [];
            var origShadowMode = [];
            var origEnabled = [];
            var sceneLights = scene._lights;
            var mask;
            for(i=0; i<sceneLights.length; i++) {
                if (sceneLights[i]._enabled) {
                    mask = sceneLights[i].mask;
                    if ((mask & maskLightmap) !==0) {
                        origMask.push(mask);
                        origShadowMode.push(sceneLights[i].shadowUpdateMode);
                        sceneLights[i].setMask(0xFFFFFFFF);
                        sceneLights[i].shadowUpdateMode =
                            sceneLights[i].getType()===pc.LIGHTTYPE_DIRECTIONAL? pc.SHADOWUPDATE_REALTIME : pc.SHADOWUPDATE_THISFRAME;
                        lights.push(sceneLights[i]);
                    }
                }
                origEnabled.push(sceneLights[i]._enabled);
                sceneLights[i].setEnabled(false);
            }

            // Init shaders
            var chunks = pc.shaderChunks;
            var xformUv1 = chunks.transformUv1VS;
            var bakeLmEnd = chunks.bakeLmEndPS;
            var dilate = chunks.dilatePS;

            var dilateShader = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, dilate, "lmDilate");
            var constantTexSource = device.scope.resolve("source");
            var constantPixelOffset = device.scope.resolve("pixelOffset");
            var constantUvScaleOffset = device.scope.resolve("uvScaleOffset");

            var copyImageShader = chunks.createShaderFromCode(device, chunks.fullscreenQuadVS, chunks.fullscreenQuadPS, "fsQuadSimple");

            var i, j;

            var lms = {};
            var lm, m, mat;
            var drawCalls = scene.drawCalls;

            // update scene matrices
            for(i=0; i<drawCalls.length; i++) {
                if (drawCalls[i].node) drawCalls[i].node.getWorldTransform();
            }

            // Store scene values
            var origFog = scene.fog;
            var origDrawCalls = scene.drawCalls;

            scene.fog = pc.FOG_NONE;

            // Create pseudo-camera
            if (!lmCamera) {
                lmCamera = new pc.Camera();
                lmCamera._node = new pc.GraphNode();
                lmCamera.setClearOptions({color:[0.0, 0.0, 0.0, 0.0], depth:1, flags:null});//pc.CLEARFLAG_COLOR});
                lmCamera.frustumCulling = false;
            }

            var node;
            var lm, rcv, mat;

            // Disable existing scene lightmaps
            for(node=0; node<allNodes.length; node++) {
                rcv = allNodes[node].model.model.meshInstances;
                for(i=0; i<rcv.length; i++) {
                    rcv[i]._shaderDefs &= ~pc.SHADERDEF_LM;
                    //rcv[i].mask |= pc.MASK_DYNAMIC;
                    //rcv[i].mask &= ~pc.MASK_LIGHTMAP;
                }
            }

            // Change shadow casting
            var origCastShadows = [];
            for(node=0; node<allNodes.length; node++) {
                origCastShadows[node] = allNodes[node].model.castShadows;
                allNodes[node].model.castShadows = allNodes[node].model.data.castShadowsLightmap;
            }

            var origMat = [];

            // Prepare models
            var nodeBounds = [];
            var nodeTarg = [];
            var targ, targTmp;
            var light, shadowCam;
            var pass;
            var passAtlasId, needToCopyPrevContent, needToClear;

            scene.updateShadersFunc(device); // needed to initialize skybox once, so it wont pop up during lightmap rendering

            for(node=0; node<nodes.length; node++) {
                rcv = nodesMeshInstances[node];
                // Store original material values to be changed
                for(i=0; i<rcv.length; i++) {
                    mat = rcv[i].material;
                    origMat.push(mat);
                }
            }

            // Create LM material
            if (!lmMaterial) {
                lmMaterial = new pc.PhongMaterial();
                lmMaterial.chunks.transformVS = xformUv1; // draw UV1
                lmMaterial.chunks.endPS = bakeLmEnd; // encode to RGBM

                // don't bake ambient
                lmMaterial.ambient = new pc.Color(0,0,0);
                lmMaterial.ambientTint = true;

                // avoid writing unrelated things to alpha
                lmMaterial.chunks.outputAlphaPS = "\n";
                lmMaterial.chunks.outputAlphaOpaquePS = "\n";
                lmMaterial.chunks.outputAlphaPremulPS = "\n";
                lmMaterial.cull = pc.CULLFACE_NONE;
                lmMaterial.forceUv1 = true; // provide data to xformUv1

                lmMaterial.lightMapTiling = forceTiling;
                lmMaterial.lightMapOffset = forceOffset;

                lmMaterial.update();
            }

            // Prepare nodes
            for(node=0; node<nodes.length; node++) {
                rcv = nodesMeshInstances[node];
                lm = lmaps[node];

                // Calculate model AABB
                if (rcv.length > 0) {
                    bounds.copy(rcv[0].aabb);
                    for(i=0; i<rcv.length; i++) {
                        rcv[i].node.getWorldTransform();
                        bounds.add(rcv[i].aabb);
                    }
                }
                var nbounds = new pc.BoundingBox();
                nbounds.copy(bounds);
                nodeBounds.push(nbounds);

                for(i=0; i<rcv.length; i++) {
                    // patch meshInstance
                    m = rcv[i];
                    m._shaderDefs &= ~pc.SHADERDEF_LM; // disable LM define, if set, to get bare ambient on first pass
                    m.mask = maskLightmap; // only affected by LM lights
                    m.deleteParameter("texture_lightMap");
                    m.deleteParameter("texture_lightMapTransform");

                    // patch material
                    m.material = lmMaterial;
                }

                targ = new pc.RenderTarget(device, lm, {
                    depth: false
                });
                nodeTarg.push(targ);
            }

            // Disable all bakeable lights
            for(j=0; j<lights.length; j++) {
                lights[j].setEnabled(false);
            }

            // Accumulate lights into RGBM textures
            for(i=0; i<lights.length; i++) {

                lights[i].setEnabled(true); // enable next light
                lights[i]._cacheShadowMap = true;

                // calculate bounds of local light for culling
                if (lights[i].getType()!==pc.LIGHTTYPE_DIRECTIONAL) {
                    lights[i]._node.getWorldTransform();
                    lights[i].getBoundingSphere(tempSphere);
                    lightBounds.center = tempSphere.center;
                    lightBounds.halfExtents.x = tempSphere.radius;
                    lightBounds.halfExtents.y = tempSphere.radius;
                    lightBounds.halfExtents.z = tempSphere.radius;
                }

                // calculate spot frustum for better culling
                if (lights[i].getType()===pc.LIGHTTYPE_SPOT) {
                    light = lights[i];
                    shadowCam = this.renderer.getShadowCamera(device, light);

                    shadowCam._node.setPosition(light._node.getPosition());
                    shadowCam._node.setRotation(light._node.getRotation());
                    shadowCam._node.rotateLocal(-90, 0, 0);

                    shadowCam.setProjection(pc.PROJECTION_PERSPECTIVE);
                    shadowCam.setNearClip(light.getAttenuationEnd() / 1000);
                    shadowCam.setFarClip(light.getAttenuationEnd());
                    shadowCam.setAspectRatio(1);
                    shadowCam.setFov(light.getOuterConeAngle() * 2);

                    this.renderer.updateCameraFrustum(shadowCam);
                }

                // Update atlases first (pass = atlasId; final pass is anything non-atlased)
                for(pass=0; pass<currentAtlasId+1; pass++) {
                    firstNode = true;
                    for(node=0; node<nodes.length; node++) {

                        passAtlasId = texAtlasId[node];
                        if (passAtlasId===undefined) passAtlasId = currentAtlasId;
                        if (passAtlasId!==pass) continue; // filter nodes by atlas ID of the pass

                        rcv = nodesMeshInstances[node];
                        lm = lmaps[node];
                        bounds = nodeBounds[node];
                        targ = nodeTarg[node];
                        targTmp = texPool[lm.width];
                        texTmp = targTmp.colorBuffer;

                        // Tweak camera to fully see the model, so directional light frustum will also see it
                        if (lights[i].getType()===pc.LIGHTTYPE_DIRECTIONAL) {
                            tempVec.copy(bounds.center);
                            tempVec.y += bounds.halfExtents.y;

                            lmCamera._node.setPosition(tempVec);
                            lmCamera._node.setEulerAngles(-90, 0, 0);

                            var frustumSize = Math.max(bounds.halfExtents.x, bounds.halfExtents.z);

                            lmCamera.setProjection( pc.PROJECTION_ORTHOGRAPHIC );
                            lmCamera.setNearClip( 0 );
                            lmCamera.setFarClip( bounds.halfExtents.y * 2 );
                            lmCamera.setAspectRatio( 1 );
                            lmCamera.setOrthoHeight( frustumSize );
                        } else {
                            // cull nodes if not affected by light AABB
                            if (!lightBounds.intersects(bounds)) {
                                continue;
                            }
                        }

                        if (lights[i].getType()===pc.LIGHTTYPE_SPOT) {
                            // cull nodes if not affected by spotlight's frustum
                            var nodeVisible = false;
                            for(j=0; j<rcv.length; j++) {
                                if (this.renderer._isVisible(shadowCam, rcv[j])) {
                                    nodeVisible = true;
                                    break;
                                }
                            }
                            if (!nodeVisible) {
                                continue;
                            }
                        }

                        // Use remaining nodes as draw calls
                        scene.drawCalls = [];
                        var fuck = false;
                        for(j=0; j<rcv.length; j++) {

                            rcv[j].setParameter("texture_lightMapTransform",
                                texAtlasId[node]!==undefined? texAtlasScaleOffset[node].data : identityMapTransform.data);

                            //if (rcv[j].node.name==="CafeTable06") console.log(i+" "+pass);
                            //if (rcv[j].node.name!=="CafeTable06") continue;
                            //if (rcv[j].node.name.substr(0,9)==="CafeTable") console.log(rcv[j].node.name+" "+i+" "+pass);
                            //if (rcv[j].node.name.substr(0,9)!=="CafeTable") continue;

                            //if (rcv[j].node.name==="CafeTable06" || rcv[j].node.name==="CafeTable04") console.log(rcv[j].node.name+" "+i+" "+pass);
                            //if (rcv[j].node.name!=="CafeTable06" && rcv[j].node.name!=="CafeTable04") continue;
                            //if (rcv[j].node.name==="CafeTable04") fuck = true;
                            //if (fuck) continue;

                            scene.drawCalls.push(rcv[j]);
                        }
                        if (scene.drawCalls.length===0) continue;
                        scene.updateShaders = true;

                        constantUvScaleOffset.setValue(texAtlasId[node]!==undefined? texAtlasScaleOffset[node].data : identityMapTransform.data);


                       //console.log("Baking light "+lights[i]._node.name + " on model " + nodes[node].name);

                       needToCopyPrevContent = pass===currentAtlasId || firstNode;
                        //needToCopyPrevContent = firstNode;
                        //needToClear = pass===currentAtlasId;
                        firstNode = false;

                        if (needToCopyPrevContent) console.log("Copy to " + texTmp.name);
                        console.log("Render light" + i + " " + lm.name + " -> " + texTmp.name);

                        if (needToCopyPrevContent) {
                            constantTexSource.setValue(lm);
                            device.setColorWrite(true, true, true, true);
                            pc.drawQuadWithShader(device, targTmp, copyImageShader, rect);
                        }

                        lmCamera.setClearOptions({color:[0.0, 0.0, 0.0, 0.0], depth:1, flags:(needToClear? pc.CLEARFLAG_COLOR : null)});

                        // ping-ponging output
                        lmCamera.setRenderTarget(targTmp);

                        this.renderer.render(scene, lmCamera);
                        stats.renderPasses++;

                        /*lmaps[node] = texTmp;
                        nodeTarg[node] = targTmp;
                        texPool[lm.width] = targ;*/

                        for(j=0; j<nodes.length; j++) {

                            /*if (lmaps[j]===texTmp) {
                                lmaps[j] = lm;
                                nodeTarg[j] = nodeTarg[node];
                                rcv = nodesMeshInstances[j];
                                for(k=0; k<rcv.length; k++) {
                                    m = rcv[k];
                                    m.setParameter("texture_lightMap", lm);
                                    m._shaderDefs |= pc.SHADERDEF_LM;
                                }
                            }*/

                            if (lmaps[j]===lm) {
                                lmaps[j] = texTmp;
                                nodeTarg[j] = targTmp;
                                rcv = nodesMeshInstances[j];
                                for(k=0; k<rcv.length; k++) {
                                    m = rcv[k];
                                    m.setParameter("texture_lightMap", texTmp); // ping-ponging input
                                    m._shaderDefs |= pc.SHADERDEF_LM; // force using LM even if material doesn't have it
                                }
                            }
                        }
                        texPool[lm.width] = targ;

                        if (!pc.lm) pc.lm = [];
                        pc.lm[pass] = texTmp;
                        if (pass<currentAtlasId) pc.lm[0] = lm;

                        /*for(j=0; j<rcv.length; j++) {
                            m = rcv[j];
                            m.setParameter("texture_lightMap", texTmp); // ping-ponging input
                            m._shaderDefs |= pc.SHADERDEF_LM; // force using LM even if material doesn't have it
                        }*/
                    }
                }

                lights[i].setEnabled(false); // disable that light
                lights[i]._cacheShadowMap = false;
            }


            var id = 0;
            for(node=0; node<nodes.length; node++) {

                rcv = nodesMeshInstances[node];
                lm = lmaps[node];
                targ = nodeTarg[node];
                targTmp = texPool[lm.width];
                texTmp = targTmp.colorBuffer;

                /*// Dilate
                var numDilates2x = 4; // 8 dilates
                var pixelOffset = new pc.Vec2(1/lm.width, 1/lm.height);
                constantPixelOffset.setValue(pixelOffset.data);
                for(i=0; i<numDilates2x; i++) {
                    constantTexSource.setValue(lm);
                    pc.drawQuadWithShader(device, targTmp, dilateShader);

                    constantTexSource.setValue(texTmp);
                    pc.drawQuadWithShader(device, targ, dilateShader);
                }*/


                for(i=0; i<rcv.length; i++) {
                    m = rcv[i];
                    m.mask = maskBaked;

                    // roll material back
                    rcv[i].material = origMat[id];

                    // Set lightmap
                    rcv[i].setParameter("texture_lightMap", lm);
                    rcv[i].setParameter("texture_lightMapTransform",
                        texAtlasId[node]!==undefined? texAtlasScaleOffset[node].data : identityMapTransform.data);

                    id++;
                }

                sceneLightmaps.push(lm);
                sceneLightmapsNode.push(nodes[node]);

                // Clean up
                targ.destroy();
            }

            for(var key in texPool) {
                if (texPool.hasOwnProperty(key)) {
                    texPool[key].colorBuffer.destroy();
                    texPool[key].destroy();
                }
            }

            // Revert shadow casting
            for(node=0; node<allNodes.length; node++) {
                allNodes[node].model.castShadows = origCastShadows[node];
            }

            // Enable all lights back
            for(i=0; i<lights.length; i++) {
                lights[i].setMask(origMask[i]);
                lights[i].shadowUpdateMode = origShadowMode[i];
            }

            for(i=0; i<sceneLights.length; i++) {
                sceneLights[i].setEnabled(origEnabled[i]);
            }

            // Roll back scene stuff
            scene.drawCalls = origDrawCalls;
            scene.fog = origFog;

            scene._updateLightStats(); // update statistics

            this.device.fire('lightmapper:end', {
                timestamp: pc.now(),
                target: this
            });

            stats.renderTime = pc.now() - startTime;
            stats.shadersLinked = device._shaderStats.linked - startShaders;
        }
    };

    return {
        Lightmapper: Lightmapper,
        MASK_DYNAMIC: maskDynamic,
        MASK_BAKED: maskBaked,
        MASK_LIGHTMAP: maskLightmap
    };
}());
