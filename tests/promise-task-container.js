'use strict';

/* --execute=mocha-- */

var chai = require('chai')
    , bPromise = require('bluebird')
    , PromiseTask = require('../lib-core/promise-task')
    , PromiseTaskContainer = require('../lib-core/promise-task-container')
    , Lazy = require('../lib-helpers/lazy-extensions');

chai.config.includeStack = true;
var assert = chai.assert;

suite("PromiseTaskContainer", function() {
    var ptc1
        , ptc2
        , ptc3
        , t1
        , t2
        , t3;

    setup(function() {
        t1 = new PromiseTask()
            .id('t1')
            .task(function(optArg) {
                return bPromise.delay(500);
            });
        t2 = new PromiseTask()
            .id('t2')
            .task(function(optArg) {
                return bPromise.delay(1000);
            });
        t3 = new PromiseTask()
            .id('t3')
            .dependencies(t1)
            .task(function(optArg) {
                return bPromise.delay(500);
            });

        ptc1 = new PromiseTaskContainer()
            .addTask(t1)
            .addTask(t2)
            .addTask(t3);

        ptc2 = new PromiseTaskContainer()
            .addTask(t1)
            .addTask(t2);
        ptc3 = new PromiseTaskContainer()
            .addTask(t3);
    });

    test("addTask", function addTask() {
        assert.strictEqual(ptc1._taskList().get('t1'), t1);
        assert.strictEqual(ptc1._taskList().get('t3'), t3);
        assert.throw(function() {
            ptc1.addTask(t1);
        });
    });

    test("addTasks", function addTasks() {
        var ptc4 = new PromiseTaskContainer()
            .addTasks(t1, t2, t3);

        assert.isTrue(ptc1.equals(ptc4));

        ptc4 = new PromiseTaskContainer()
            .addTasks([t1, t2, t3]);

        assert.isTrue(ptc1.equals(ptc4));

        ptc4 = new PromiseTaskContainer()
            .addTasks(Lazy([t1, t2, t3]));

        assert.isTrue(ptc1.equals(ptc4));

        ptc4 = new PromiseTaskContainer();

        assert.throw(function() {
            ptc4.addTasks('1');
        });

        ptc4.addTasks(t1, t2, t3);

        assert.throw(function() {
            ptc4.addTasks([t1, t2]);
        });
    });

    test("getTask", function getTask() {
        assert.strictEqual(ptc1.getTask('t1'), t1);
        assert.strictEqual(ptc1.getTask('t3'), t3);

        assert.strictEqual(typeof ptc1.getTask('t4'), 'undefined');
        assert.doesNotThrow(function() {
            ptc1.getTask('t4');
        });
        assert.throw(function() {
            ptc1.getTask('t4', true);
        });
    });

    test("gatherContainers", function gatherContainers() {
        var ptc4 = new PromiseTaskContainer()
            .gatherContainers([ptc2, ptc3]);

        assert.isTrue(ptc1.equals(ptc4));

        assert.throw(function() {
            ptc4.gatherContainers([ptc1]);
        });
    });

    test("checkForCircularDependencies", function checkForCircularDependencies() {
        assert.doesNotThrow(function() {
            ptc1.checkForCircularDependencies();
        });

        ptc1.getTask('t1')
            .dependencies(t3);

        assert.throw(function() {
            ptc1.checkForCircularDependencies();
        }, PromiseTaskContainer.CIRCULAR_ERROR_MESSAGE);
    });

    test("equals", function equals() {
        var ptc2 = new PromiseTaskContainer()
            .addTask(t1)
            .addTask(t2)
            .addTask(t3);

        assert.ok(ptc1.equals(ptc2));
        assert.ok(PromiseTaskContainer.equals(ptc1, ptc2));
    });
});
