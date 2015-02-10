'use strict';

var xor = require('component-xor');

function bothNullOrEquals(left_, right_, eqFn_) {
    var normalizedEqFn = normalizeEqualityFunction(eqFn_, "Invalid Argument: bothNullOrEquals requires an undefined, string, or function argument");
    var res;
    if (xor(left_ === null, right_ === null)) {
        res = false;
    } else if (left_ === null && right_ === null) {
        res = true;
    } else { // neither left nor right are null, so we can safely pass them into the equality function
        res = normalizedEqFn(left_, right_);
    }

    return res;
}

// make sure to pass this as the eqFn into bothNullOrEquals so you don't get a null error
function dateEqFn(left_, right_) {
    return left_.getTime() === right_.getTime();
}

function normalizeEqualityFunction(eqFn_, err_) {
    var normalizedEqFn;

    // Logic for below is as follows:
    //   - If eqFn is undefined, then test for strict equality
    //   - If it is a string, then we assume the iterated element has an equality property named whatever eqFn is
    //   - If it's a function, then we assume it takes in two arguments and returns a boolean for equality.
    //   - normalizedEqFn turns each of the above into a normalized equality function(left, right).
    if (typeof eqFn_ === 'undefined') {
        normalizedEqFn = function(left, right) {
            return left === right;
        };
    } else if (typeof eqFn_ === 'string') {
        normalizedEqFn = function(left, right) {
            return left[eqFn_](right);
        };
    } else if (typeof eqFn_ === 'function') {
        normalizedEqFn = eqFn_;
    } else {
        var msg = (typeof err_ === 'string') ? err_ : "Invalid Argument: normalizedEqualityFunction requires an undefined, string, or function argument";

        throw new Error(msg);
    }

    return normalizedEqFn;
}

function in_array(item, arr) {
    return arr.indexOf(item) !== -1;
}

function instance_of(obj, fxn) {
    var found = false;
    var objProto = Object.getPrototypeOf(obj);
    while (objProto !== null && !found) {
        found = objProto.constructor.name === fxn.name;
        objProto = Object.getPrototypeOf(objProto);
    }
    return found;
}

//---------//
// Exports //
//---------//

module.exports.xor = xor;
module.exports.bothNullOrEquals = bothNullOrEquals;
module.exports.dateEqFn = dateEqFn;
module.exports.normalizeEqualityFunction = normalizeEqualityFunction;
module.exports.in_array = in_array;
module.exports.instance_of = instance_of;
