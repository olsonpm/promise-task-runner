'use strict';

var PromiseTask = require('../../lib-core/promise-task')
    , PromiseTaskContainer = require('../../lib-core/promise-task-container')
    , bPromise = require('bluebird')
    , chai = require('chai');

chai.config.includeStack = true;
var assert = chai.assert;
var ptc = new PromiseTaskContainer();

var a = new PromiseTask()
    .id('a')
    .bTask(function() {
        var start = new Date();
        return bPromise.delay(500).then(function() {
            var diff = (new Date()).getTime() - start.getTime();
            assert.closeTo(diff, 500, 50);
            return start;
        });
    });

var b = new PromiseTask()
    .id('b')
    .bTask(function() {
        var start = new Date();
        return bPromise.delay(1000).then(function() {
            var diff = (new Date()).getTime() - start.getTime();
            assert.ok(diff, 1000, 50);
            return start;
        });
    });

var c = new PromiseTask()
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

var d = new PromiseTask()
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

var e = new PromiseTask()
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

var f = new PromiseTask()
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

module.exports = ptc.addTasks(a, b, c, d, e, f);
