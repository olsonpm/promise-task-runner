'use strict';


//---------//
// Imports //
//---------//

var PromiseTaskManager = require('./promise-task-manager')
    , PromiseTaskContainer = require('./promise-task-container')
    , program = require('commander')
    , path = require('path')
    , Config = new require('../lib-helpers/config');


//------//
// Init //
//------//

var curConfig = new Config({
    packageJsonRootProperty: 'PromiseTaskRunner'
    , envPrefix: 'PROMISETASKRUNNER_'
});
program.commandRan = false;
var TASKDIR = 'taskDir';
var DEFAULT_TASKDIR = './tasks';


//------//
// Main //
//------//

program
    .version('0.0.1')
    .description('**For specific questions relating to taskDir configuration, please see the wiki at\n    https://github.com/olsonpm/promise-task-runner/wiki');

program
    .command('run-task <taskName> [globalTaskArgs...]')
    .description('Runs a task defined in the configured or specified task directory.')
    .option('-d, --task-dir [taskDir]', 'task directory')
    .option('-q, --quiet', "don't display success message")
    .action(runTask);

program
    .command('set-default-dir <taskDir>')
    .description('Sets the default task directory name')
    .option('-q, --quiet', "don't display success message")
    .action(setDefaultTaskDir);

program
    .command('get-default-dir')
    .description('Displays the default task directory name')
    .action(getDefaultTaskDir);

program
    .command('get-active-dir')
    .description("Displays the active task directory name and what configuration location it's coming from.")
    .action(getActiveTaskDir);

//--------------------------------------------------//
// Action functions (external for testing purposes) //
//--------------------------------------------------//

function runTask(taskName, globalTaskArgs, options) {
    var startTime = new Date();
    program.commandRan = true;
    var globalArgs = {};
    if (globalTaskArgs) {
        globalTaskArgs.forEach(function(ga) {
            var gaSplit = ga.split('=', 2);
            var tmpName = gaSplit[0];
            var tmpVal = gaSplit[1];
            globalArgs[tmpName] = tmpVal;
        });
    }

    var tmpTaskDir = options.taskDir
        || curConfig.get(TASKDIR, {
            shouldThrow: true
            , defaultIfNone: DEFAULT_TASKDIR
        });
    if (tmpTaskDir.length >= 1 && tmpTaskDir.slice(0, 1) !== '/') {
        tmpTaskDir = path.join(process.cwd(), tmpTaskDir);
    }

    var ptm = new PromiseTaskManager();

    return ptm.gatherTasks(tmpTaskDir)
        .then(function(curPtm) {
            return curPtm.runTask(taskName, globalArgs);
        })
        .then(function() {
            var endTime = new Date();
            if (!options.quiet) {
                console.log("Finished running task '" + taskName + "' in " + (endTime - startTime) / 1000 + " seconds");
            }
        })
        .catch(function(err) {
            if (err.message === PromiseTaskContainer.CIRCULAR_ERROR_MESSAGE) {
                console.log("Error: There exists a circular dependency in your tasks.  This is not allowed and must be fixed before running any tasks.");
                console.log("Original error message: " + err.originalMessage);
            } else {
                throw err;
            }
        });
}

function setDefaultTaskDir(tdir, options) {
    program.commandRan = true;
    curConfig.setDefault(TASKDIR, tdir);
    if (!options.quiet) {
        console.log("Default directory is now '" + tdir + "'");
    }
}

function getDefaultTaskDir() {
    program.commandRan = true;
    console.log('Default task directory: ' + curConfig.getDefault(TASKDIR, {
        defaultIfNone: DEFAULT_TASKDIR
    }));
}

function getActiveTaskDir() {
    program.commandRan = true;
    var resObj = curConfig.getValAndLocation(TASKDIR, {
        defaultIfNone: DEFAULT_TASKDIR
    });
    console.log("Task directory: '" + resObj.val + "' configured in '" + resObj.location + "'");
}


//---------//
// Exports //
//---------//

module.exports = program;
module.exports.actions = {
    runTask: runTask
    , setDefaultTaskDir: setDefaultTaskDir
    , getDefaultTaskDir: getDefaultTaskDir
    , getActiveTaskDir: getActiveTaskDir
};
