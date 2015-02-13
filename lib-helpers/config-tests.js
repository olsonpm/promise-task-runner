'use strict';
/* --execute=mocha-- */

var Config = require('./config')
    , chai = require('chai');

var assert = chai.assert;
chai.config.includeStack = true;

suite("config.js", function() {
    var testConf;
    setup(function() {
        testConf = new Config({
            envPrefix: 'testConfig_'
            , packageJsonDir: __dirname
            , packageJsonRootProperty: 'testConfig'
            , _defaultConfig: './config.json'
        });
        process.env.testConfig_testPropName = 'testPropVal';
    });

    suite("getFromLocation - test all built in locations", function getFromLocation() {
        test("get package", function get_package() {
            assert.strictEqual(testConf.getFromLocation('testPropName', 'package'), 'testPropVal');
        });
        test("get env", function get_env() {
            assert.strictEqual(testConf.getFromLocation('testPropName', 'env'), 'testPropVal');
        });
        test("get default", function get_defeault() {
            assert.strictEqual(testConf.getFromLocation('testPropName', 'default'), 'testPropVal');
            assert.strictEqual(testConf.getDefault('testPropName'), 'testPropVal');
        });
        test("throws error", function throws_error() {
            assert.throw(function() {
                testConf.getFromLocation('testDefaultPriority', 'env', {
                    shouldThrow: true
                });
            });
        });
    });

    test("get - various priority assertions", function get() {
        process.env.testConfig_testPackageJsonPriority = 'envVal';
        process.env.testConfig_testEnvPriority = 'envVal';

        assert.strictEqual(testConf.get('testPackageJsonPriority'), 'packageJsonVal');
        assert.strictEqual(testConf.get('testEnvPriority'), 'envVal');
        assert.strictEqual(testConf.get('testDefaultPriority'), 'defaultVal');
    });

    test("getValAndLocation", function getValAndLocation() {
        process.env.testConfig_testPackageJsonPriority = 'envVal';
        process.env.testConfig_testEnvPriority = 'envVal';

        assert.deepEqual(testConf.getValAndLocation('testPackageJsonPriority'), {
            val: 'packageJsonVal'
            , location: 'package.json'
        });
        assert.deepEqual(testConf.getValAndLocation('testEnvPriority'), {
            val: 'envVal'
            , location: 'Environment variable'
        });
        assert.deepEqual(testConf.getValAndLocation('testDefaultPriority'), {
            val: 'defaultVal'
            , location: 'Default configuration'
        });
    });

    test("set and delete default", function set_and_delete_default() {
        var whataday = 'whataday';
        var yesitwas = 'yesitwas';
        assert.throw(function() {
            testConf.getFromLocation(whataday, 'default', {
                shouldThrow: true
            });
        });

        testConf.setDefault(whataday, yesitwas);
        assert.strictEqual(testConf.getFromLocation(whataday, 'default'), yesitwas);
        testConf.removeDefault(whataday);

        assert.throw(function() {
            testConf.getFromLocation(whataday, 'default', {
                shouldThrow: true
            });
        });

        testConf.setDefault(whataday, yesitwas);
        assert.strictEqual(testConf.getFromLocation(whataday, 'default'), yesitwas);
        // making sure setDefault without a second parameter is the same thing as removeDefault
        testConf.setDefault(whataday);

        assert.throw(function() {
            testConf.getFromLocation(whataday, 'default', {
                shouldThrow: true
            });
        });
    });
});
