pc.extend(pc, function () {
    var Hmd = function (app) {
        InitializeWebVRPolyfill();

        this._app = app;
        this._device = app.graphicsDevice;

        this._frameData = new VRFrameData();
        this.display = null;

        this.sitToStandInv = new pc.Mat4();

        this.leftView = new pc.Mat4();
        this.leftProj = new pc.Mat4();//{data:null};
        this.leftViewInv = new pc.Mat4();
        this.leftPos = new pc.Vec3();

        this.rightView = new pc.Mat4();
        this.rightProj = new pc.Mat4();//{data:null};
        this.rightViewInv = new pc.Mat4();
        this.rightPos = new pc.Vec3();

        this.combinedPos = new pc.Vec3();
        this.combinedView = new pc.Mat4();
        this.combinedProj = new pc.Mat4();
        this.combinedViewInv = new pc.Mat4();

        this.presenting = false;

        pc.events.attach(this);
    };

    Hmd.prototype = {
        initialize: function (fn) {
            var self = this;
            self._presentChange = function () {
                self.presenting = (self.display && self.display.isPresenting);
            };
            window.addEventListener('vrdisplaypresentchange', self._presentChange, false);

            this._enumerateDisplays(fn);
        },

        destroy: function () {
            window.removeEventListener('vrdisplaypresentchange', self._presentChange);
        },

        poll: function () {
            if (this.display) {
                this.display.getFrameData(this._frameData);

                this.leftProj.data = this._frameData.leftProjectionMatrix;
                this.rightProj.data = this._frameData.rightProjectionMatrix;

                var stage = this.display.stageParameters;
                if (stage) {

                    this.sitToStandInv.set(stage.sittingToStandingTransform).invert();

                    this.combinedView.set(this._frameData.leftViewMatrix);
                    this.leftView.mul2(this.combinedView, this.sitToStandInv);

                    this.combinedView.set(this._frameData.rightViewMatrix);
                    this.rightView.mul2(this.combinedView, this.sitToStandInv);
                } else {

                    this.leftView.set(this._frameData.leftViewMatrix);
                    this.rightView.set(this._frameData.rightViewMatrix);
                }

                // Find combined position and view matrix
                // Camera is offset backwards to cover both frustums

                // Extract widest frustum plane and calculate fov
                var nx = this.leftProj.data[3] + this.leftProj.data[0];
                var nz = this.leftProj.data[11] + this.leftProj.data[8];
                var l = 1.0 / Math.sqrt(nx*nx + nz*nz);
                nx *= l;
                nz *= l;
                var maxFov = -Math.atan2(nz,nx) * 2.0;

                var aspect = this.rightProj.data[5] / this.rightProj.data[0];

                var view = this.combinedView;
                view.copy(this.leftView);
                view.invert();
                this.leftViewInv.copy(view);
                var pos = this.combinedPos.data;
                pos[0] = this.leftPos.data[0] = view.data[12];
                pos[1] = this.leftPos.data[1] = view.data[13];
                pos[2] = this.leftPos.data[2] = view.data[14];
                view.copy(this.rightView);
                view.invert();
                this.rightViewInv.copy(view);
                var deltaX = pos[0] - view.data[12];
                var deltaY = pos[1] - view.data[13];
                var deltaZ = pos[2] - view.data[14];
                var dist = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
                this.rightPos.data[0] = view.data[12];
                this.rightPos.data[1] = view.data[13];
                this.rightPos.data[2] = view.data[14];
                pos[0] += view.data[12];
                pos[1] += view.data[13];
                pos[2] += view.data[14];
                pos[0] *= 0.5; // middle pos
                pos[1] *= 0.5;
                pos[2] *= 0.5;
                var b = Math.PI * 0.5;
                var c = maxFov * 0.5;
                var a = Math.PI - (b + c);
                var offset = dist * 0.5 * ( Math.sin(a) );// / Math.sin(b) ); // equals 1
                var fwdX = view.data[8];
                var fwdY = view.data[9];
                var fwdZ = view.data[10];
                view.data[12] = pos[0] + fwdX * offset; // our forward goes backwards so + instead of -
                view.data[13] = pos[1] + fwdY * offset;
                view.data[14] = pos[2] + fwdZ * offset;
                this.combinedViewInv.copy(view);
                view.invert();

                // Find combined projection matrix
                this.combinedProj.setPerspective(maxFov * pc.math.RAD_TO_DEG,
                                                 aspect,
                                                 this.display.depthNear + offset,
                                                 this.display.depthFar + offset,
                                                 true);
            }
        },

        requestPresent: function (callback) {
            if (this.display) {
                this.display.requestPresent([{source: this._device.canvas}]).then(function () {
                    if (callback) callback();
                }, function (err) {
                    if (callback) callback(err);
                });
            }
        },

        exitPresent: function (callback) {
            if (this.display) {
                this.display.exitPresent().then(function () {
                    if (callback) callback();
                }, function () {
                    if (callback) callback("exitPresent failed");
                });
            }
        },

        submitFrame: function () {
            if (this.display) this.display.submitFrame();
        },

        setClipPlanes: function (n, f) {
            if (this.display) {
                this.display.depthNear = n;
                this.display.depthFar = f;
            }
        },

        getFrameData: function () {
            if (this.display) return this._frameData;
        },

        _enumerateDisplays: function (fn) {
            var self = this;
            if (navigator.getVRDisplays) {
                navigator.getVRDisplays().then(function (displays) {
                    if (displays.length) {
                        self.display = displays[0];
                    }
                    fn(null, self);
                });
            } else {
                fn(new Error("WebVR not supported"));
            }
        },
    };

    return {
        Hmd: Hmd
    };
}());
