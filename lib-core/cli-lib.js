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

var curConfig = new Config();
program.commandRan = false;
var TASKDIR = 'taskDir';


//------//
// Main //
//------//

program
    .version('0.0.1');

program
    .command('run-task <taskName> [globalTaskArgs...]')
    .description('runs a task defined in ./task-manager')
    .option('-d, --task-dir [taskDir]', 'task directory')
    .option('-q, --quiet', "don't display success message")
    .action(runTask);

program
    .command('set-default-dir <taskDir>')
    .description('sets the default task directory name')
    .option('-q, --quiet', "don't display success message")
    .action(setDefaultTaskDir);

program
    .command('get-default-dir')
    .description('displays the default task directory name')
    .action(getDefaultTaskDir);

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
        });
    if (tmpTaskDir.length >= 1 && tmpTaskDir.slice(0, 1) !== '/') {
        tmpTaskDir = path.join(process.cwd(), tmpTaskDir);
    }

    var ptm = new PromiseTaskManager()
        .taskDir(tmpTaskDir);

    return ptm.gatherTasks()
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
    console.log('Default task directory: ' + curConfig.getDefault(TASKDIR));
}


//---------//
// Exports //
//---------//

module.exports = program;
module.exports.actions = {
    runTask: runTask
    , setDefaultTaskDir: setDefaultTaskDir
    , getDefaultTaskDir: getDefaultTaskDir
};
