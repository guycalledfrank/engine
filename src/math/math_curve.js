pc.extend(pc, (function () {

    var CURVE_LINEAR = 0;
    var CURVE_SMOOTHSTEP = 1;

    var Curve = function (data) {
        this.keys = [];
        this.type = CURVE_SMOOTHSTEP;

        if (data) {
            for (var i = 0; i < data.length - 1; i += 2) {
                this.keys.push([data[i], data[i+1]]);
            }
        }

        this.sort();
    };

    Curve.prototype = {
        add: function (time, value) {
            var keys = this.keys;
            var len = keys.length;
            var i = 0;

            for (; i < len; i++) {
                if (keys[i][0] > time) {
                    break;
                }
            }

            var key = [time, value];
            this.keys.splice(i, 0, key);
            return key;
        },

        get: function (index) {
            return this.keys[index];
        },

        sort: function () {
            this.keys.sort(function (a, b) {
                return a[0] - b[0];
            });
        },

        value: function (time) {
            var keys = this.keys;

            var leftTime = 0;
            var leftValue = keys.length ? keys[0][1] : 0;

            var rightTime = 1;
            var rightValue = 0;

            for (var i = 0, len = keys.length; i < len; i++) {

                // early exit check
                if (keys[i][0] === time) {
                    return keys[i][1];
                }

                rightValue = keys[i][1];

                if (time < keys[i][0]) {
                    rightTime = keys[i][0];
                    break;
                }

                leftTime = keys[i][0];
                leftValue = keys[i][1];
            }

            var div = rightTime - leftTime;

            var interpolation = (div === 0 ? 0 : (time - leftTime) / div);

            if (this.type === CURVE_SMOOTHSTEP) {
                interpolation *= interpolation * (3 - 2 * interpolation);
            }

            return pc.math.lerp(leftValue, rightValue, interpolation);
        },

        closest: function (time) {
            var keys = this.keys;
            var length = keys.length;
            var min = 2;
            var result = null;

            for (var i = 0; i < length; i++) {
                var diff = Math.abs(time - keys[i][0]);
                if (min >= diff) {
                    min = diff;
                    result = keys[i];
                } else {
                    break;
                }
            }

            return result;
        },

        clone: function () {
            var result = new pc.Curve();
            result.keys = pc.extend(result.keys, this.keys);
            result.type = this.type;
            return result;
        },

        quantize: function(precision) {
            precision = Math.max(precision, 2);

            var values = new Float32Array(precision);
            var step = 1.0 / (precision - 1);

            // quantize graph to table of interpolated values
            for (var i = 0; i < precision; i++) {
                var value = this.value(step * i);
                values[i] = value;
            }

            return values;
        }
    };

    Object.defineProperty(Curve.prototype, 'length', {
        get: function() {
            return this.keys.length;
        }
    });

    return {
        Curve: Curve,
        CURVE_LINEAR: CURVE_LINEAR,
        CURVE_SMOOTHSTEP: CURVE_SMOOTHSTEP
    };
}()));
