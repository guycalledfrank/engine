pc.extend(pc, function () {
    var viewProj = new pc.Mat4();

    var pdiff1 = new pc.Vec3();
    var pdiff2 = new pc.Vec3();
    var pnormal = new pc.Vec3();

    /**
     * @name pc.Frustum
     * @class A frustum is a shape that defines the viewing space of a camera.
     * @description Creates a new frustum shape.
     * @example
     * // Create a new frustum equivalent to one held by a camera component
     * var projectionMatrix = entity.camera.projectionMatrix;
     * var viewMatrix = entity.camera.viewMatrix;
     * var frustum = new pc.Frustum(projectionMatrix, viewMatrix);
     * @param {pc.Mat4} projectionMatrix The projection matrix describing the shape of the frustum.
     * @param {pc.Mat4} viewMatrix The inverse of the world transformation matrix for the frustum.
     */
    var Frustum = function Frustum(projectionMatrix, viewMatrix) {
        projectionMatrix = projectionMatrix || new pc.Mat4().setPerspective(90, 16 / 9, 0.1, 1000);
        viewMatrix = viewMatrix || new pc.Mat4();

        this.planes = [];
        for (var i = 0; i < 6; i++)
            this.planes[i] = [ ];

        this.update(projectionMatrix, viewMatrix);
    };

    Frustum.prototype = {
        /**
         * @function
         * @name pc.Frustum#update
         * @description Updates the frustum shape based on a view matrix and a projection matrix.
         * @param {pc.Mat4} projectionMatrix The projection matrix describing the shape of the frustum.
         * @param {pc.Mat4} viewMatrix The inverse of the world transformation matrix for the frustum.
         */
        update: function (projectionMatrix, viewMatrix) {
            viewProj.mul2(projectionMatrix, viewMatrix);
            var vpm = viewProj.data;

            // Extract the numbers for the RIGHT plane
            this.planes[0][0] = vpm[ 3] - vpm[ 0];
            this.planes[0][1] = vpm[ 7] - vpm[ 4];
            this.planes[0][2] = vpm[11] - vpm[ 8];
            this.planes[0][3] = vpm[15] - vpm[12];
            // Normalize the result
            var t = Math.sqrt(this.planes[0][0] * this.planes[0][0] + this.planes[0][1] * this.planes[0][1] + this.planes[0][2] * this.planes[0][2]);
            this.planes[0][0] /= t;
            this.planes[0][1] /= t;
            this.planes[0][2] /= t;
            this.planes[0][3] /= t;

            // Extract the numbers for the LEFT plane
            this.planes[1][0] = vpm[ 3] + vpm[ 0];
            this.planes[1][1] = vpm[ 7] + vpm[ 4];
            this.planes[1][2] = vpm[11] + vpm[ 8];
            this.planes[1][3] = vpm[15] + vpm[12];
            // Normalize the result
            t = Math.sqrt(this.planes[1][0] * this.planes[1][0] + this.planes[1][1] * this.planes[1][1] + this.planes[1][2] * this.planes[1][2]);
            this.planes[1][0] /= t;
            this.planes[1][1] /= t;
            this.planes[1][2] /= t;
            this.planes[1][3] /= t;

            // Extract the BOTTOM plane
            this.planes[2][0] = vpm[ 3] + vpm[ 1];
            this.planes[2][1] = vpm[ 7] + vpm[ 5];
            this.planes[2][2] = vpm[11] + vpm[ 9];
            this.planes[2][3] = vpm[15] + vpm[13];
            // Normalize the result
            t = Math.sqrt(this.planes[2][0] * this.planes[2][0] + this.planes[2][1] * this.planes[2][1] + this.planes[2][2] * this.planes[2][2] );
            this.planes[2][0] /= t;
            this.planes[2][1] /= t;
            this.planes[2][2] /= t;
            this.planes[2][3] /= t;

            // Extract the TOP plane
            this.planes[3][0] = vpm[ 3] - vpm[ 1];
            this.planes[3][1] = vpm[ 7] - vpm[ 5];
            this.planes[3][2] = vpm[11] - vpm[ 9];
            this.planes[3][3] = vpm[15] - vpm[13];
            // Normalize the result
            t = Math.sqrt(this.planes[3][0] * this.planes[3][0] + this.planes[3][1] * this.planes[3][1] + this.planes[3][2] * this.planes[3][2]);
            this.planes[3][0] /= t;
            this.planes[3][1] /= t;
            this.planes[3][2] /= t;
            this.planes[3][3] /= t;

            // Extract the FAR plane
            this.planes[4][0] = vpm[ 3] - vpm[ 2];
            this.planes[4][1] = vpm[ 7] - vpm[ 6];
            this.planes[4][2] = vpm[11] - vpm[10];
            this.planes[4][3] = vpm[15] - vpm[14];
            // Normalize the result
            t = Math.sqrt(this.planes[4][0] * this.planes[4][0] + this.planes[4][1] * this.planes[4][1] + this.planes[4][2] * this.planes[4][2]);
            this.planes[4][0] /= t;
            this.planes[4][1] /= t;
            this.planes[4][2] /= t;
            this.planes[4][3] /= t;

            // Extract the NEAR plane
            this.planes[5][0] = vpm[ 3] + vpm[ 2];
            this.planes[5][1] = vpm[ 7] + vpm[ 6];
            this.planes[5][2] = vpm[11] + vpm[10];
            this.planes[5][3] = vpm[15] + vpm[14];
            // Normalize the result
            t = Math.sqrt(this.planes[5][0] * this.planes[5][0] + this.planes[5][1] * this.planes[5][1] + this.planes[5][2] * this.planes[5][2]);
            this.planes[5][0] /= t;
            this.planes[5][1] /= t;
            this.planes[5][2] /= t;
            this.planes[5][3] /= t;
        },

        /**
         * @function
         * @name pc.Frustum#setPortal
         * @description Updates the frustum shape based on a camera position and forward vector, 4 portal points, portal normal and clip distance.
         * @param {pc.Vec3} pos Camera position
         * @param {pc.Vec3} fwd Camera forward direction
         * @param {pc.Vec3} bl Bottom-left point
         * @param {pc.Vec3} br Bottom-right point
         * @param {pc.Vec3} tl Top-left point
         * @param {pc.Vec3} tr Top-right point
         * @param {pc.Vec3} normal Portal normal
         * @param {Number} far Far plane distance
         */
        setPortal: function (pos, fwd, bl, br, tl, tr, normal, far) {
            var segA, segB, dist;

            // RIGHT
            segA = br;
            segB = tr;
            pdiff1.sub2(segA, segB);
            pdiff2.sub2(segB, pos);
            pnormal.cross(pdiff1, pdiff2).normalize();
            dist = pos.dot(pnormal);
            this.planes[0][0] = pnormal.x;
            this.planes[0][1] = pnormal.y;
            this.planes[0][2] = pnormal.z;
            this.planes[0][3] = -dist;

            // LEFT
            segA = tl;
            segB = bl;
            pdiff1.sub2(segA, segB);
            pdiff2.sub2(segB, pos);
            pnormal.cross(pdiff1, pdiff2).normalize();
            dist = pos.dot(pnormal);
            this.planes[1][0] = pnormal.x;
            this.planes[1][1] = pnormal.y;
            this.planes[1][2] = pnormal.z;
            this.planes[1][3] = -dist;

            // BOTTOM
            segA = bl;
            segB = br;
            pdiff1.sub2(segA, segB);
            pdiff2.sub2(segB, pos);
            pnormal.cross(pdiff1, pdiff2).normalize();
            dist = pos.dot(pnormal);
            this.planes[2][0] = pnormal.x;
            this.planes[2][1] = pnormal.y;
            this.planes[2][2] = pnormal.z;
            this.planes[2][3] = -dist;

            // TOP
            segA = tr;
            segB = tl;
            pdiff1.sub2(segA, segB);
            pdiff2.sub2(segB, pos);
            pnormal.cross(pdiff1, pdiff2).normalize();
            dist = pos.dot(pnormal);
            this.planes[3][0] = pnormal.x;
            this.planes[3][1] = pnormal.y;
            this.planes[3][2] = pnormal.z;
            this.planes[3][3] = -dist;

            // NEAR
            this.planes[5][0] = normal.x;
            this.planes[5][1] = normal.y;
            this.planes[5][2] = normal.z;
            this.planes[5][3] = -normal.dot(tr);

            // FAR
            this.planes[4][0] = fwd.x;
            this.planes[4][1] = fwd.y;
            this.planes[4][2] = fwd.z;
            this.planes[4][3] = far;// + this.planes[5][3];
        },

        /**
         * @function
         * @name pc.Frustum#containsPoint
         * @description Tests whether a point is inside the frustum. Note that points lying in a frustum plane are
         * considered to be outside the frustum.
         * @param {pc.Vec3} point The point to test
         * @returns {Boolean} true if the point is inside the frustum, false otherwise
         */
        containsPoint: function (point) {
            for (var p = 0; p < 6; p++)
                if (this.planes[p][0] * point.x +
                    this.planes[p][1] * point.y +
                    this.planes[p][2] * point.z +
                    this.planes[p][3] <= 0)
                    return false;
            return true;
        },

        /**
         * @function
         * @name pc.Frustum#containsSphere
         * @description Tests whether a bounding sphere intersects the frustum. If the sphere is outside the frustum,
         * zero is returned. If the sphere intersects the frustum, 1 is returned. If the sphere is completely inside
         * the frustum, 2 is returned. Note that a sphere touching a frustum plane from the outside is considered to
         * be outside the frustum.
         * @param {pc.BoundingSphere} sphere The sphere to test
         * @returns {Number} 0 if the bounding sphere is outside the frustum, 1 if it intersects the frustum and 2 if
         * it is contained by the frustum
         */
        containsSphere: function (sphere) {
            var c = 0;
            var d;
            var p;

            var sr = sphere.radius;
            var sc = sphere.center.data;
            var scx = sc[0];
            var scy = sc[1];
            var scz = sc[2];
            var planes = this.planes;
            var plane;

            for (p = 0; p < 6; p++) {
                plane = planes[p];
                d = plane[0] * scx + plane[1] * scy + plane[2] * scz + plane[3];
                if (d <= -sr)
                    return 0;
                if (d > sr)
                    c++;
            }

            return (c === 6) ? 2 : 1;
        }
    };

    return {
        Frustum: Frustum
    };
}());
