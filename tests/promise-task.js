'use strict';

/* --execute=mocha-- */

var chai = require('chai')
    , bPromise = require('bluebird')
    , PromiseTask = require('../lib-core/promise-task');

var assert = chai.assert;
chai.config.includeStack = true;

suite("PromiseTask", function() {
    var a, b, c, d, e, f, g;

    setup(function() {
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
                    assert.closeTo(diff, 1000, 50);
                    return start;
                });
            });

        c = new PromiseTask()
            .id('a')
            .bTask(function() {
                return bPromise.delay(500).then(function() {});
            });

        d = new PromiseTask()
            .id('d')
            .dependencies([a, b])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.closeTo(startDiff, 1000, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.closeTo(endDiff, 1500, 50);
                    return startTime;
                });
            });

        e = new PromiseTask()
            .id('e')
            .dependencies([a])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.closeTo(startDiff, 500, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.closeTo(endDiff, 1000, 50);
                    return startTime;
                });
            });

        f = new PromiseTask()
            .id('f')
            .dependencies([d, e])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.closeTo(startDiff, 1500, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.closeTo(endDiff, 2000, 50);
                    return startTime;
                });
            });

        g = new PromiseTask()
            .id('g')
            .dependencies([e, f])
            .bTask(function(optArg) {
                var startTime = optArg[0];
                var startDiff = (new Date()).getTime() - startTime.getTime();
                assert.closeTo(startDiff, 2000, 50);
                return bPromise.delay(500).then(function() {
                    var endDiff = (new Date()).getTime() - startTime.getTime();
                    assert.closeTo(endDiff, 2500, 50);
                    return startTime;
                });
            });
    });

    test("equals", function() {

        assert.isFalse(a.equals(b));
        assert.isTrue(a.equals(c));
        assert.isFalse(PromiseTask.equals(a, b));
        assert.isTrue(PromiseTask.equals(a, c));
    });

    test("run simple", function() {
        return a.run().then(function(res) {
            assert.ok(true);
        });
    });

    test("run simple with globalArgs", function() {
        a.bTask(function() {
            assert.strictEqual(this.globalArgs().arg1Name, 'arg1Val');
            assert.strictEqual(this.globalArgs().arg2Name, 'arg2Val');
            return bPromise.resolve();
        });
        return a.globalArgs({
                arg1Name: 'arg1Val'
                , arg2Name: 'arg2Val'
            })
            .run();
    });

    test("run complex", function() {
        this.timeout(10000);
        return g.run().then(function(res) {
            assert.ok(true);
        });
    });
});
