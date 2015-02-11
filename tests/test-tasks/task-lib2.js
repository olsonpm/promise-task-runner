'use strict';

var PromiseTask = require('../../lib-core/promise-task')
    , PromiseTaskContainer = require('../../lib-core/promise-task-container')
    , bPromise = require('bluebird')
    , chai = require('chai');

chai.config.includeStack = true;
var assert = chai.assert;
var ptc = new PromiseTaskContainer();

var g = new PromiseTask()
    .id('g')
    .task(function() {
        var start = new Date();
        return bPromise.delay(500).then(function() {
            var diff = (new Date()).getTime() - start.getTime();
            assert.closeTo(diff, 500, 50);
            return start;
        });
    });

module.exports = ptc.addTask(g);
