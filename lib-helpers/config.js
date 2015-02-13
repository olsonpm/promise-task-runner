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
        new Location(Config.PACKAGE.key, Config.PACKAGE.name, 10, getFromPackageJson, {
            dir: this.packageJsonDir
            , rootProp: this.packageJsonRootProperty
        })
        , new Location(Config.ENV.key, Config.ENV.name, 20, getFromEnv, {
            envPrefix: this.envPrefix
        })
        , new Location(Config.DEFAULT.key, Config.DEFAULT.name, 30, getFromDefault, {
            defaultConfig: this._defaultConfig
        })
    ];
}

Config.PACKAGE = {
    key: 'PACKAGE'
    , name: 'package.json'
};
Config.ENV = {
    key: 'ENV'
    , name: 'Environment variable'
};
Config.DEFAULT = {
    key: 'DEFAULT'
    , name: 'Default configuration'
};

Config.prototype.get = function get(propName, argsObj) {
    argsObj = argsObj || {};
    var newArgsObj = {
        defaultIfNone: argsObj.defaultIfNone
        , shouldThrow: argsObj.shouldThrow
    };
    return this._getValAndLocation(propName, argsObj).val;
};

Config.prototype.getValAndLocation = function getPropAndLocation(propName, argsObj) {
    argsObj = argsObj || {};
    var newArgsObj = {
        defaultIfNone: argsObj.defaultIfNone
        , shouldThrow: argsObj.shouldThrow
    };
    return this._getValAndLocation(propName, newArgsObj);
};

Config.prototype.getFromLocation = function getFromLocation(propName, location, argsObj) {
    argsObj = argsObj || {};
    var newArgsObj = {
        defaultIfNone: argsObj.defaultIfNone
        , shouldThrow: argsObj.shouldThrow
        , location: location
    };
    return this._getValAndLocation(propName, newArgsObj).val;
};

Config.prototype._getValAndLocation = function _getValAndLocation(propName, argsObj) {
    var res;
    argsObj = argsObj || {};
    var defaultIfNone = argsObj.defaultIfNone;
    var location = argsObj.location;
    var shouldThrow = argsObj.shouldThrow;
    var curLocation;

    if (defaultIfNone && shouldThrow) {
        throw new Error("Invalid Argument: defaultIfNone and shouldThrow cannot both be truthy");
    }

    if (typeof location === 'undefined') {
        curLocation = Lazy(this.Locations)
            .sort(function(left, right) {
                return left.priority - right.priority;
            })
            .find(function(l) {
                return l.getProp(propName);
            });

        if (typeof curLocation === 'undefined' && shouldThrow) {
            throw new Error("Invalid Argument: Configuration property '" + propName + "' not found in any locations");
        }
    } else { // location is defined
        curLocation = Lazy(this.Locations)
            .find(function(l) {
                return l.key.toLowerCase() === location.toLowerCase();
            });
        if (typeof curLocation === 'undefined') {
            throw new Error("Invalid Argument: Location '" + location + "' doesn't exist");
        }
    }

    res = curLocation && curLocation.getProp(propName);

    if (typeof res === 'undefined' && typeof defaultIfNone !== 'undefined') {
        res = defaultIfNone;
        curLocation = {
            name: Config.DEFAULT.name
        };
    } else if (typeof res === 'undefined' && shouldThrow) {
        throw new Error("Invalid Argument: Property '" + propName + "' hasn't been set");
    }

    return {
        location: curLocation.name
        , val: res
    };
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

Config.prototype.getDefault = function getDefault(propName, argsObj) {
    return this.getFromLocation(propName, 'default', argsObj);
};

Config.prototype.removeDefault = function removeDefault(propName) {
    this.setDefault(propName, undefined);
};


//---------------------------//
// Set up built-in locations //
//---------------------------//

function Location(key_, name_, priority_, getter_, getterArgsObj_) {
    this.key = key_;
    this.name = name_;
    this.priority = priority_;
    this.getter = getter_;
    this.getArgsObj = getterArgsObj_;
}
Location.prototype.getProp = function getProp(propName, shouldThrow) {
    return this.getter.call(this, propName, shouldThrow, this.getArgsObj);
};

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
    if (bFs.existsSync(configPath)) {
        configJson = require(configPath);
    } else { // config.json doesn't exist, so let's create it
        bFs.writeFileSync(configPath, JSON.stringify({}));
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
