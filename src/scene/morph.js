pc.extend(pc, function () {
    var _morphMin = new pc.Vec3();
    var _morphMax = new pc.Vec3();

    /**
     * @name pc.MorphTarget
     */
    var MorphTarget = function (indices, positions, normals, tangents) {
        this.indices = indices;
        this.positions = positions;
        this.normals = normals;
        this.tangents = tangents;
    };

    /**
     * @name pc.Morph
     */
    var Morph = function (targets) {
        this._baseBuffer = null;//baseVertexBuffer;
        this._baseAabb = null;//baseAabb;
        this._targets = targets;
        this._targetAabbs = [];
        this._targetAabbs.length = this._targets.length;
        this.aabb = new pc.BoundingBox(new pc.Vec3(), new pc.Vec3());
        this._dirty = true;
        this._aabbDirty = true;

        this._baseData = null;
        this._offsetPF = 0;
        this._offsetNF = 0;
        this._offsetTF = 0;
        this._vertSizeF = 0;
    };

    pc.extend(Morph.prototype, {

        _setBaseMesh: function (baseMesh) {
            this._baseBuffer = baseMesh.vertexBuffer;
            this._baseAabb = baseMesh._aabb;

            this._baseData = new Float32Array(this._baseBuffer.storage);

            var offsetP = -1;
            var offsetN = -1;
            var offsetT = -1;
            var elems = this._baseBuffer.format.elements;
            var vertSize = this._baseBuffer.format.size;
            for(var j=0; j<elems.length; j++) {
                if (elems[j].name === pc.SEMANTIC_POSITION) {
                    offsetP = elems[j].offset;
                } else if (elems[j].name === pc.SEMANTIC_NORMAL) {
                    offsetN = elems[j].offset;
                } else if (elems[j].name === pc.SEMANTIC_TANGENT) {
                    offsetT = elems[j].offset;
                }
            }
            this._offsetPF = offsetP / 4;
            this._offsetNF = offsetN / 4;
            this._offsetTF = offsetT / 4;
            this._vertSizeF = vertSize / 4;

            this._dirty = true;
        },

        _calculateAabb: function () {
            if (!this._baseBuffer) return;

            this.aabb.copy(this._baseAabb);

            this._targetAabbs.length = this._targets.length;
            //this.mesh.boneAabb = null; // to be recalculated

            var numVerts = this._baseBuffer.numVertices;
            var numIndices;
            var i, j, k, target, targetAabb, elems, vertSize, offsetP, offsetN, offsetT, dataF, offsetPF, offsetNF, offsetTF, vertSizeF;
            var x, y, z;

            for(i=0; i<this._targets.length; i++) {
                target = this._targets[i];
                targetAabb = this._targetAabbs[i];

                if (!targetAabb) {
                    targetAabb = this._targetAabbs[i] = this.aabb.clone();
                    _morphMin.set(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
                    _morphMax.set(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

                    numIndices = target.indices.length;
                    for(j=0; j<numIndices; j++) {
                        x = target.positions[j*3];
                        y = target.positions[j*3 + 1];
                        z = target.positions[j*3 + 2];

                        if (_morphMin.x > x) _morphMin.x = x;
                        if (_morphMin.y > y) _morphMin.y = y;
                        if (_morphMin.z > z) _morphMin.z = z;

                        if (_morphMax.x < x) _morphMax.x = x;
                        if (_morphMax.y < y) _morphMax.y = y;
                        if (_morphMax.z < z) _morphMax.z = z;
                    }
                    targetAabb.setMinMax(_morphMin, _morphMax);
                }
                this.aabb.add(targetAabb);
            }
        },

        addTarget: function (vb) {
            if (vb.numVertices !== this._baseBuffer.numVertices) {
                // #ifdef DEBUG
                console.error("Morph target vertex count doesn't match base mesh vertex count");
                // #endif
                return;
            }
            this._targets.push(vb);
            this._aabbDirty = true;
        },

        removeTarget: function (vb) {
            var index = this._targets.indexOf(vb);
            if (index !== -1) {
                this._targets.splice(index, 1);
                this._aabbDirty = true;
            }
        }
    });

    /**
     * @name pc.MorphInstance
     */
    var MorphInstance = function (morph) {
        this.morph = morph;
        this._vertexBuffer = null;
        this._vertexData = null;
        this._weights = [];
        this._bas
        this._dirty = true;
    };

    MorphInstance.prototype = {

        _setBaseMesh: function (baseMesh) {
            this.destroy();
            this._vertexBuffer = new pc.VertexBuffer(this.morph._baseBuffer.device, this.morph._baseBuffer.format,
                                                     this.morph._baseBuffer.numVertices, pc.BUFFER_DYNAMIC, this.morph._baseBuffer.storage.slice(0));
            this._vertexData = new Float32Array(this._vertexBuffer.storage);
            this._weights = [];
            this._weights.length = this.morph._targets.length;
            for(var i=0; i<this.morph._targets.length; i++) {
                this._weights[i] = 0;
            }
            this._dirty = true;
        },

        destroy: function () {
            if (this._vertexBuffer) {
                this._vertexBuffer.destroy();
                this._vertexBuffer = null;
            }
        },

        getWeight: function (index) {
            return this._weights[index];
        },

        setWeight: function (index, value) {
            this._weights[index] = value;
            this._dirty = true;
        },

        update: function (mesh) {

            if (this.morph._baseBuffer !== mesh.vertexBuffer) {
                this.morph._setBaseMesh(mesh);
                this._setBaseMesh(mesh);
            }

            if (this.morph._aabbDirty) {
                this.morph._calculateAabb();
                this.morph._aabbDirty = false;
            }

            var numVerts = this.morph._baseBuffer.numVertices;
            var numIndices, index;

            var targets = this.morph._targets;
            var weights = this._weights;
            var target, weight, j, id, j3, j4;
            var vertSizeF = this.morph._vertSizeF;
            var offsetPF = this.morph._offsetPF;
            var offsetNF = this.morph._offsetNF;
            var offsetTF = this.morph._offsetTF;

            var baseData = this.morph._baseData;
            var vdata = this._vertexData;
            vdata.set(this.morph._baseData);

            for(var i=0; i<targets.length; i++) {
                weight = weights[i];
                if (weight === 0) continue;
                target = targets[i];
                numIndices = target.indices.length;

                for(j=0; j<numIndices; j++) {

                    j3 = j * 3;
                    index = target.indices[j];

                    id = index * vertSizeF + offsetPF;
                    vdata[id] += (target.positions[j3] - baseData[id]) * weight;
                    vdata[id + 1] += (target.positions[j3 + 1] - baseData[id + 1]) * weight;
                    vdata[id + 2] += (target.positions[j3 + 2] - baseData[id + 2]) * weight;

                    if (target.normals) {
                        id = index * vertSizeF + offsetNF;
                        vdata[id] += (target.normals[j3] - baseData[id]) * weight;
                        vdata[id + 1] += (target.normals[j3 + 1] - baseData[id + 1]) * weight;
                        vdata[id + 2] += (target.normals[j3 + 2] - baseData[id + 2]) * weight;

                        if (target.tangents) {
                            j4 = j * 4;
                            id = index * vertSizeF + offsetTF;
                            vdata[id] += (target.tangents[j4] - baseData[id]) * weight;
                            vdata[id + 1] += (target.tangents[j4 + 1] - baseData[id + 1]) * weight;
                            vdata[id + 2] += (target.tangents[j4 + 2] - baseData[id + 2]) * weight;
                            vdata[id + 3] += (target.tangents[j4 + 3] - baseData[id + 3]) * weight;
                            vdata[id + 3] = vdata[id + 3] > 0 ? 1 : -1;
                        }
                    }

                }
            }

            this._vertexBuffer.unlock();
        }
    };

    return {
        MorphTarget: MorphTarget,
        Morph: Morph,
        MorphInstance: MorphInstance
    };
}());
