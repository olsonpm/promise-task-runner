'use strict';

var PromiseTask = require('../../lib-core/promise-task')
    , PromiseTaskContainer = require('../../lib-core/promise-task-container')
    , bPromise = require('bluebird')
    , chai = require('chai');

chai.config.includeStack = true;
var assert = chai.assert;
var ptc = new PromiseTaskContainer();

var hReturn = 'this is h speaking';
var iReturn = 'read you loud and clear h.  I speaking';
var jReturn = 'Roger h and i.  This is j';

var h = new PromiseTask()
    .id('h')
    .task(function() {
        assert.strictEqual(this.globalArgs().arg1, 'starting arg');
        return bPromise.delay(500).thenReturn(hReturn);
    });

var i = new PromiseTask()
    .id('i')
    .dependencies(h)
    .task(function(argArrayFromH) {
        assert.strictEqual(this.globalArgs().arg1, 'starting arg');
        assert.strictEqual(argArrayFromH[0], hReturn);
        return bPromise.delay(1000).thenReturn(iReturn);
    });

var j = new PromiseTask()
    .id('j')
    .dependencies([h, i])
    .task(function(argArray) {
        assert.strictEqual(this.globalArgs().arg1, 'starting arg');
        assert.strictEqual(argArray[0], hReturn);
        assert.strictEqual(argArray[1], iReturn);
        return bPromise.delay(500).thenReturn(jReturn);
    });

module.exports = ptc.addTasks(h, i, j);
module.exports.jReturn = jReturn;
