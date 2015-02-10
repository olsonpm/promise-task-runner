'use strict';

//---------//
// Imports //
//---------//

var PromiseTask = require('./promise-task')
    , chai = require('chai')
    , Toposort = require('toposort-class')
    , Utils = require('../lib-helpers/utils')
    , Lazy = require('../lib-helpers/lazy-extensions');

var Sequence = Lazy.Sequence;
var ObjectLikeSequence = Lazy.ObjectLikeSequence;


//----------------------------------------------------------------//
// API Summary
//----------------------------------------------------------------//
//
// Model: PromiseTaskContainer
//
// Public Properties
//   - n/a
//
// Extension methods
//   - addTask
//   - addTasks
//   - getTask
//   - gatherContainers
//   - checkForCircularDependencies
//
//----------------------------------------------------------------//

//-----------//
// Constants //
//-----------//

var CIRCULAR_ERROR_MESSAGE = "Current PromiseTaskContainer failed the check for circular dependencies";


//-------//
// Model //
//-------//

function PromiseTaskContainer() {
    var my = {
        _taskList: null
    };

    this._taskList = function(tasklist_) {
        var res = (my._taskList === null)
            ? Lazy({})
            : my._taskList;

        if (typeof tasklist_ !== 'undefined') {
            if (tasklist_ !== null) {
                PromiseTaskContainer.validateTaskList(tasklist_, true);
                my._taskList = Lazy(tasklist_);
            } else {
                my._taskList = Lazy({});
            }
            res = this;
        }

        return res;
    };
}

//------------//
// Validation //
//------------//

PromiseTaskContainer.validateTaskList = function validateTaskList(input, shouldThrow) {
    var msg;

    input = Lazy(input);
    if (!(Utils.instance_of(input, Sequence))
        || !input.allInstanceOf(PromiseTask)) {
        msg = "Invalid Argument: taskList must be an object or Lazy.ObjectLikeSequence full of PromiseTask values";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};


//------------//
// Extensions //
//------------//

PromiseTaskContainer.prototype.addTask = function addTask(pt_) {
    if (!(Utils.instance_of(pt_, PromiseTask))) {
        throw new Error("Invalid Argument: <PromiseTaskContainer>.add requires a PromiseTask argument");
    } else if (typeof this._taskList().get(pt_.id()) !== 'undefined') {
        throw new Error("Invalid Argument: This container already contains a task with id of '" + pt_.id() + "'");
    }

    var tmpPT = {};
    tmpPT[pt_.id()] = pt_;
    this._taskList(this._taskList().assign(tmpPT));

    return this;
};

PromiseTaskContainer.prototype.addTasks = function addTasks(pts_) {
    var self = this;

    var args;
    if (Utils.instance_of(pts_, PromiseTask)) {
        args = Lazy(Array.prototype.slice.call(arguments));
    } else if (Utils.instance_of(pts_, Array)) {
        args = Lazy(pts_);
    } else {
        args = pts_;
    }

    if (!(Utils.instance_of(args, Sequence) && args.allInstanceOf(PromiseTask))) {
        throw new Error("Invalid Argument: <PromiseTaskContainer>.addTasks requires all tasks to be instanceof PromiseTask");
    }

    args.each(function(pt) {
        self.addTask(pt);
    });

    return self;
};

PromiseTaskContainer.prototype.getTask = function getTask(id, shouldThrow) {
    // only throw an error if it equals undefined and we should throw an error
    var res = this._taskList().get(id);
    if (shouldThrow && typeof res === 'undefined') {
        throw new Error("Invalid Argument: Current container does not hold a PromiseTask with id: '" + id + "'");
    }

    return res;
};

PromiseTaskContainer.prototype.gatherContainers = function gatherContainers(ptcontainers_) {
    var self = this;

    var args;
    if (Utils.instance_of(ptcontainers_, PromiseTaskContainer)) {
        args = Lazy(Array.prototype.slice.call(arguments));
    } else if (Utils.instance_of(ptcontainers_, Array)) {
        args = Lazy(ptcontainers_);
    } else {
        args = ptcontainers_;
    }

    if (!(Utils.instance_of(args, Sequence) && Lazy(args).allInstanceOf(PromiseTaskContainer))) {
        throw new Error("Invalid Argument: <PromiseTaskContainer>.collect requires all containers to be instanceof PromiseTaskContainer");
    }

    args.each(function(ptc) {
        ptc._taskList()
            .values()
            .each(function(pt) {
                self.addTask(pt);
            });
    });

    return self;
};

PromiseTaskContainer.prototype.checkForCircularDependencies = function checkForCircularDependencies() {
    var tsort = new Toposort();
    this._taskList().values().each(function(pt) {
        if (pt.dependencies().size() > 0) {
            var depArray = pt.dependencies().map(function(d) {
                return d.id();
            }).toArray();

            tsort.add(pt.id(), depArray);
        }
    });

    try {
        tsort.sort();
    } catch (e) {
        // don't care about the library's error, we'll throw our own
        throw new Error(CIRCULAR_ERROR_MESSAGE);
    }

    return this;
};


//--------//
// Equals //
//--------//

PromiseTaskContainer.prototype.equals = function equals(other_) {
    if (!(Utils.instance_of(other_, PromiseTaskContainer))) {
        throw new Error("Invalid Argument: <PromiseTaskContainer>.equals expects a PromiseTaskContainer argument");
    }

    if (this === other_) {
        return true;
    }

    return Sequence.equals(this._taskList(), other_._taskList(), PromiseTask.equals);
};

PromiseTaskContainer.equals = function static_equals(left_, right_) {
    return Utils.bothNullOrEquals(left_, right_, 'equals');
};


//----------//
// toString //
//----------//

PromiseTaskContainer.prototype.toString = function toString() {
    return this._taskList().reduce(function(agg, el) {
        return agg + el + "\n";
    }, "");
};


//---------//
// Exports //
//---------//

module.exports = PromiseTaskContainer;
module.exports.CIRCULAR_ERROR_MESSAGE = CIRCULAR_ERROR_MESSAGE;
