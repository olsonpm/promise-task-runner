'use strict';

var path = require('path')
    , Lazy = require('./lazy-extensions')
    , bFs = require('fs-bluebird');

Config._DEFAULT_CONFIG_LOCATION = '../config.json';

function Config(argsObj) {
    argsObj = argsObj || {};

    this.envPrefix = argsObj.envPrefix || "";
    this.packageJsonDir = argsObj.packageJsonDir || process.cwd();
    this.packageJsonRootProperty = argsObj.packageJsonRootProperty || "";

    // this property is meant for testing purposes only
    this._defaultConfig = argsObj._defaultConfig || Config._DEFAULT_CONFIG_LOCATION;

    this.Locations = [
        new Location('PACKAGE', 10, getFromPackageJson, {
            dir: this.packageJsonDir
            , rootProp: this.packageJsonRootProperty
        })
        , new Location('ENV', 20, getFromEnv, {
            envPrefix: this.envPrefix
        })
        , new Location('DEFAULT', 30, getFromDefault, {
            defaultConfig: this._defaultConfig
        })
    ];
}

Config.prototype.get = function get(propName, argsObj) {
    var res;
    argsObj = argsObj || {};
    var location = argsObj.location;
    var shouldThrow = argsObj.shouldThrow;
    var curLocation;

    if (typeof location === 'undefined') {
        curLocation = Lazy(this.Locations)
            .sort(function(left, right) {
                return left.priority - right.priority;
            })
            .find(function(l) {
                return l.getProp(propName);
            });

        if (typeof curLocation === 'undefined') {
            throw new Error("Invalid Argument: Configuration property '" + propName + "' not found in any locations");
        }

        res = curLocation.getProp(propName);
    } else { // location is defined
        curLocation = Lazy(this.Locations)
            .find(function(l) {
                return l.name.toLowerCase() === location.toLowerCase();
            });
        if (typeof curLocation === 'undefined') {
            throw new Error("Invalid Argument: Location '" + location + "' doesn't exist");
        }

        res = curLocation.getProp(propName);
    }

    if (shouldThrow && typeof res === 'undefined') {
        throw new Error("Invalid Argument: Property '" + propName + "' hasn't been set");
    }
    return res;
};

Config.prototype.setDefault = function setDefault(propName, val) {
    var tmpConfigFile = path.join(__dirname, this._defaultConfig);
    var resJson;
    if (bFs.existsSync(tmpConfigFile)) {
        resJson = require(tmpConfigFile);
    } else {
        resJson = {};
    }

    if (typeof val === 'undefined') {
        delete resJson[propName];
    } else {
        resJson[propName] = val;
    }

    bFs.writeFileSync(tmpConfigFile, JSON.stringify(resJson, null, 4));
};

Config.prototype.getDefault = function getDefault(propName) {
    return this.get(propName, {
        location: 'default'
    });
};

Config.prototype.removeDefault = function removeDefault(propName) {
    this.setDefault(propName, undefined);
};


//---------------------------//
// Set up built-in locations //
//---------------------------//

function Location(name_, priority_, getter_, getterArgsObj_) {
    this.name = name_;
    this.priority = priority_;
    this.getter = getter_;
    this.getArgsObj = getterArgsObj_;
}
Location.prototype.getProp = function getProp(propName, shouldThrow) {
    return this.getter.call(this, propName, shouldThrow, this.getArgsObj);
};

Location.PACKAGE = 'PACKAGE';
Location.ENV = 'ENV';
Location.DEFAULT = 'DEFAULT';

function getFromEnv(propName, shouldThrow, argsObj) {
    argsObj = argsObj || {};

    var res;
    if (typeof argsObj.envPrefix === 'string') {
        res = process.env[argsObj.envPrefix + propName];
    }

    if (shouldThrow && typeof res === 'undefined') {
        throw new Error("Invalid Argument: environment variable '" + propName + "' doesn't exist");
    }

    return res;
}

function getFromPackageJson(propName, shouldThrow, argsObj) {
    argsObj = argsObj || {};

    var pjson
        , pjsonPath
        , res;
    if (argsObj.dir.length > 0 && argsObj.dir.slice(0, 1) !== '/') {
        pjsonPath = './' + path.join(argsObj.dir, 'package.json');
    } else {
        pjsonPath = path.join(argsObj.dir, 'package.json');
    }
    if (bFs.existsSync(pjsonPath)) {
        pjson = require(pjsonPath);
        res = (pjson[argsObj.rootProp] && pjson[argsObj.rootProp][propName])
            ? pjson[argsObj.rootProp][propName]
            : undefined;
    } else {
        res = undefined;
    }

    if (shouldThrow && typeof res === 'undefined') {
        throw new Error("Invalid Argument: package.json setting '" + argsObj.rootProp + "." + propName + "' doesn't exist");
    }

    return res;
}

function getFromDefault(propName, shouldThrow, argsObj) {
    argsObj = argsObj || {};
    var configJson = {};

    var configPath = path.join(__dirname, argsObj.defaultConfig);
    try {
        configJson = require(configPath);
    } catch (err) {
        // config file doesn't exist
        throw new Error("No config.json file exists at '" + configPath + "'");
    }

    var res = configJson[propName];
    if (shouldThrow && typeof res === 'undefined') {
        throw new Error("Invalid Argument: config property '" + propName + "' doesn't exist");
    }

    return res;
}

//-----------------------//
// End of location logic //
//-----------------------//

module.exports = Config;
