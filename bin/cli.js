#!/usr/bin/env node

'use strict';

var ttmCli = require('../lib-core/cli-lib.js');
ttmCli.parse(process.argv);

if (!ttmCli.commandRan) {
    ttmCli.outputHelp();
}
