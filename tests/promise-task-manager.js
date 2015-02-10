'use strict';

/* --execute=mocha-- */

var chai = require('chai')
    , bPromise = require('bluebird')
    , PromiseTask = require('../lib-core/promise-task')
    , PromiseTaskContainer = require('../lib-core/promise-task-container')
    , PromiseTaskManager = require('../lib-core/promise-task-manager')
    , path = require('path');

chai.config.includeStack = true;
var assert = chai.assert;

suite("promise-task-manager", function() {
    var myPtm
        , lib1Const
        , lib2Const
        , lib3Const
        , a, b, c, d, e, f, g, h, i, j;

    setup(function() {
        myPtm = new PromiseTaskManager()
            .taskDir(path.join(__dirname, 'test-tasks'));

        //-------------------//
        //  task-lib1 Const  //
        //-------------------//

        a = new PromiseTask()
            .id('a')
            .bTask(function() {
                var start = new Date();
                return bPromise.delay(500).then(function() {
                    var diff = (new Date()).getTime() - start.getTime();
                    assert.closeTo(diff, 500, 50);
                    return start;
                });
            });

        b = new PromiseTask()
            .id('b')
            .bTask(function() {
                var start = new Date();
                return bPromise.delay(1000).then(function() {
                    var diff = (new Date()).getTime() - start.getTime();
                    assert.ok(diff, 1000, 50);
                    return start;
                });
            });

        c = new PromiseTask()
            .id('c')
            .dependencies([a, b])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.ok(startDiff, 1000, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.ok(endDiff, 1500, 50);
                    return startTime;
                });
            });

        d = new PromiseTask()
            .id('d')
            .dependencies([a])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.ok(startDiff, 500, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.ok(endDiff, 1000, 50);
                    return startTime;
                });
            });

        e = new PromiseTask()
            .id('e')
            .dependencies([c, d])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.ok(startDiff, 1500, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.ok(endDiff, 2000, 50);
                    return startTime;
                });
            });

        f = new PromiseTask()
            .id('f')
            .dependencies([d, e])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.ok(startDiff, 2000, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.ok(endDiff, 2500, 50);
                    return startTime;
                });
            });


        //-------------------//
        //  task-lib2 Const  //
        //-------------------//

        g = new PromiseTask()
            .id('g')
            .bTask(function() {
                var start = new Date();
                return bPromise.delay(500).then(function() {
                    var diff = (new Date()).getTime() - start.getTime();
                    assert.closeTo(diff, 500, 50);
                    return start;
                });
            });

        h = new PromiseTask()
            .id('h')
            .bTask(function(startArg) {
                return bPromise.delay(500).then(function() {
                    return startArg;
                });
            });

        i = new PromiseTask()
            .id('i')
            .dependencies(h)
            .bTask(function(argFromA) {
                return bPromise.delay(1000).then(function() {
                    return argFromA + ' passed through b';
                });
            });

        j = new PromiseTask()
            .id('j')
            .dependencies([h, i])
            .bTask(function(argArray) {
                return bPromise.delay(500).then(function() {
                    argArray.push("c's return value");
                    return argArray;
                });
            });

        lib1Const = new PromiseTaskContainer()
            .addTasks(a, b, c, d, e, f);
        lib2Const = new PromiseTaskContainer()
            .addTask(g);
        lib3Const = new PromiseTaskContainer()
            .addTasks(h, i, j);
    });

    test("gatherTasks", function gatherTasks() {
        return myPtm.gatherTasks()
            .then(function() {
                var tmpPtc = new PromiseTaskContainer()
                    .gatherContainers(lib1Const, lib2Const, lib3Const);

                assert.isTrue(myPtm.taskContainer().equals(tmpPtc));
            });
    });

    test("runTask", function runTask() {
        this.timeout(10000);

        return myPtm.gatherTasks()
            .then(function(ptm) {
                return ptm.runTask('f');
            })
            .then(function() {
                assert.isTrue(true);
            });
    });

    test("runTask with args", function runTask() {
        this.timeout(10000);

        return myPtm.gatherTasks()
            .then(function(ptm) {
                return ptm.runTask('j', {
                    arg1: 'starting arg'
                });
            })
            .then(function(jRetVal) {
                assert.strictEqual(jRetVal, require('./test-tasks/task-lib3').jReturn);
            });
    });
});
