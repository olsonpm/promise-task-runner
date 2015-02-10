'use strict';

/* --execute=mocha-- */

var chai = require('chai')
    , bPromise = require('bluebird')
    , ptmCli = require('../lib-core/cli-lib.js')
    , path = require('path');

var assert = chai.assert;
chai.config.includeStack = true;

suite("promise-task-cli", function promiseTaskCli() {
    test("run-task", function runTask() {
        this.timeout(10000);
        // assert does not throw (chai's assertion swallows stack trace info)
        return ptmCli.actions.runTask('j', ['arg1=starting arg'], {
            taskDir: path.join(__dirname, 'test-tasks')
            , quiet: true
        });
    });
});
