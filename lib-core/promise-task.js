'use strict';

//---------//
// Imports //
//---------//

var Utils = require('../lib-helpers/utils')
    , Lazy = require('../lib-helpers/lazy-extensions')
    , chai = require('chai')
    , bPromise = require('bluebird');

var Sequence = Lazy.Sequence
    , ArrayLikeSequence = Lazy.ArrayLikeSequence;


//----------------------------------------------------------------//
// API Summary
//----------------------------------------------------------------//
//
// Model: PromiseTask
//
// Public Properties
//   - id:				string
//   - dependencies:	ArrayLikeSequence<PromiseTask>
//   - bTask: 			function (that returns a promise)
//   - globalArgs:		Object
//
// Extension methods
//   - run
//
//----------------------------------------------------------------//

//-------//
// Model //
//-------//

function PromiseTask() {
    var my = {
        id: null
        , dependencies: null
        , bTask: null
        , globalArgs: null
        , _bTaskResult: null
    };

    this.id = function id(id_) {
        var res = my.id;
        if (typeof id_ !== 'undefined') {
            if (id_ !== null) {
                PromiseTask.validateID(id_, true);
            }
            my.id = id_;
            res = this;
        }

        return res;
    };
    this.dependencies = function dependencies(dependencies_) {
        var res = ((my.dependencies) === null)
            ? Lazy([])
            : my.dependencies;
        if (typeof dependencies_ !== 'undefined') {
            if (dependencies_ !== null) {
                if (Utils.instance_of(dependencies_, PromiseTask)) {
                    dependencies_ = [dependencies_];
                }
                PromiseTask.validateDependencies(dependencies_, true);
            }
            my.dependencies = Lazy(dependencies_);
            res = this;
        }

        return res;
    };
    this.bTask = function bTask(btask_) {
        var self = this;
        var res = my.bTask;
        if (typeof btask_ !== 'undefined') {
            if (btask_ !== null) {
                PromiseTask.validateBTask(btask_, true);
            }

            // bTask needs to be a singleton.  We accomplish this by setting a separate variable (_bTaskResult)
            //   whenever btask is run.  If _bTaskResult is not set, that implies the task has not yet 
            //   been run.  If it is set, then we return it.
            my.bTask = function() {
                if (my._bTaskResult === null) {
                    var promiseArray = self.dependencies()
                        .map(function(d) {
                            if (self.globalArgs()) {
                                d.globalArgs(self.globalArgs());
                            }
                            return d.run();
                        })
                        .toArray();

                    if (promiseArray.length) {
                        my._bTaskResult = bPromise.all(promiseArray)
                            .bind(self)
                            .then(btask_);
                    } else { // no dependencies
                        my._bTaskResult = btask_.call(self);
                    }

                    // sanity check
                    if (!('then' in my._bTaskResult)) {
                        throw new Error("Task with id: '" + self.id() + "' does not return a thenable.");
                    }
                }
                return my._bTaskResult;
            };
            res = this;
        }

        return res;
    };
    this.globalArgs = function globalArgs(globalargs_) {
        var res = my.globalArgs;
        if (typeof globalargs_ !== 'undefined') {
            if (globalargs_ !== null) {
                PromiseTask.validateGlobalArgs(globalargs_, true);
            }
            my.globalArgs = globalargs_;
            res = this;
        }

        return res;
    };
}


//------------//
// Validation //
//------------//

PromiseTask.validateID = function validateID(input, shouldThrow) {
    var msg;

    // regex alphanumeric with first character being a letter or underscore.
    if (!(input.match(/^[a-z_][a-z0-9_]*$/i))) {
        msg = "Invalid Argument: id must start with a letter or underscore, and contain only letters, underscores, or digits.";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};

PromiseTask.validateDependencies = function validateDependencies(input, shouldThrow) {
    var msg;
    debugger;

    if (Utils.instance_of(input, PromiseTask)) {
        input = [input];
    }
    input = Lazy(input);

    if (!(input instanceof ArrayLikeSequence)
        || !input.allInstanceOf(PromiseTask)) {
        console.log('input');
        console.log('' + input);
        console.log('instance_of');
        console.log(Utils.instance_of(input, ArrayLikeSequence));
        console.log('constructor');
        console.log(input.constructor.name);
        console.log('prototype');
        console.log('allInstanceOf');
        console.log(input.allInstanceOf(PromiseTask));
        msg = "Invalid Argument: dependencies must be instanceof Array or Lazy.ArrayLikeSequence containing PromiseTask objects.";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};

PromiseTask.validateGlobalArgs = function validateGlobalArgs(input, shouldThrow) {
    var msg;

    if (typeof input !== 'undefined' && input.constructor !== Object) {
        msg = "Invalid Argument: globalArgs must be either undefined or derive from the Object constructor";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};

PromiseTask.validateBTask = function validateBTask(input, shouldThrow) {
    var msg;

    if (typeof input !== 'function') {
        msg = "Invalid Argument: bTask must be a function (make sure it returns a promise)";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};


//------------//
// Extensions //
//------------//

PromiseTask.prototype.run = function run() {
    return this.bTask().call(this);
};


//--------//
// Equals //
//--------//

PromiseTask.prototype.equals = function equals(other_) {
    if (!(Utils.instance_of(other_, PromiseTask))) {
        throw new Error("Invalid Argument: <PromiseTask>.equals expects a PromiseTask argument");
    }

    if (this === other_) {
        return true;
    }

    return this.id() === other_.id()
        && Sequence.equals(this.dependencies, other_.dependencies, PromiseTask.equals);
};

PromiseTask.equals = function static_equals(left_, right_) {
    if (!(Utils.instance_of(left_, PromiseTask) && Utils.instance_of(right_, PromiseTask))) {
        throw new Error("Invalid Argument: <PromiseTask>.equals expects a PromiseTask argument");
    }

    return Utils.bothNullOrEquals(left_, right_, 'equals');
};


//----------//
// toString //
//----------//

PromiseTask.prototype.toString = function toString() {
    return "PromiseTask: " + this.id();
};


//---------//
// Exports //
//---------//

module.exports = PromiseTask;
