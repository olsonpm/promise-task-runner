'use strict';


//---------//
// Imports //
//---------//

var bPromise = require('bluebird')
    , bFs = require('fs-bluebird')
    , path = require('path')
    , PromiseTaskContainer = require('./promise-task-container')
    , Lazy = require('../lib-helpers/lazy-extensions')
    , Utils = require('../lib-helpers/utils')
    , chai = require('chai');

var Sequence = Lazy.Sequence;


//----------------------------------------------------------------//
// API Summary
//----------------------------------------------------------------//
//
// Model: PromiseTaskManager
//
// Public Properties
//   - taskDir:			string
//   - taskContainer:	PromiseTaskContainer
//
// Extension methods
//   - gatherTasks
//   - runTask
//
//----------------------------------------------------------------//

//-------//
// Model //
//-------//

function PromiseTaskManager() {
    var my = {
        taskDir: null
        , taskContainer: null
    };

    this.taskDir = function(taskdir_) {
        var res = my.taskDir;
        if (typeof taskdir_ !== 'undefined') {
            if (taskdir_ !== null) {
                PromiseTaskManager.validateTaskDir(taskdir_, true);
            }
            my.taskDir = taskdir_;
            res = this;
        }

        return res;
    };

    this.taskContainer = function(taskcontainer_) {
        var res = my.taskContainer;
        if (typeof taskcontainer_ !== 'undefined') {
            if (taskcontainer_ !== null) {
                PromiseTaskManager.validateTaskContainer(taskcontainer_, true);
            }
            my.taskContainer = taskcontainer_;
            res = this;
        }

        return res;
    };
}


//------------//
// Validation //
//------------//

PromiseTaskManager.validateTaskDir = function validateTaskDir(input, shouldThrow) {
    var msg;
    if (!bFs.existsSync(input)) {
        msg = "Invalid Argument: Directory '" + input + "' doesn't exist";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};

PromiseTaskManager.validateTaskContainer = function validateTaskContainer(input, shouldThrow) {
    var msg;

    if (!(Utils.instance_of(input, PromiseTaskContainer))) {
        msg = "Invalid Argument: taskList expects to be instanceof PromiseTaskContainer";
    }
    if (msg && shouldThrow) {
        throw new Error(msg);
    }

    return msg;
};


//------------//
// Extensions //
//------------//

PromiseTaskManager.prototype.gatherTasks = function gatherTasks() {
    var self = this;
    self.taskContainer(new PromiseTaskContainer());

    return bFs.readdirAsync(self.taskDir())
        .then(function(files) {
            var ptcArray = files.map(function(f) {
                // remove extension and create full path from that
                f = path.basename(f, path.extname(f));
                return require(path.join(self.taskDir(), f));
            });

            self.taskContainer().gatherContainers(ptcArray);

            return self;
        });
};

PromiseTaskManager.prototype.runTask = function runTask(id, optGlobalArgs) {
    // this allows us to chain the below.  If it were undefined, then semantically that would mean we want 
    //   the return value of globalArgs, which isn't true.
    if (typeof optGlobalArgs === 'undefined') {
        optGlobalArgs = null;
    }

    // first do a naive check for circular dependencies (naive because it can't be perfect)
    var tc = this.taskContainer()
        .checkForCircularDependencies();

    // set globalArgs for all tasks.  This is necessary in case dependencies are created within the
    //   tasks themselves, as opposed to being declared.  Ideally we'd only set the global args
    //   for tasks that actually run.
    tc._taskList().each(function(t) {
        t.globalArgs(optGlobalArgs);
    });

    return tc.getTask(id, true)
        .run();
};


//---------//
// Exports //
//---------//

module.exports = PromiseTaskManager;
