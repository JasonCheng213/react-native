/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const Logger = require('./src/Logger');

const debug = require('debug');

import type {Reporter} from './src/lib/reporting';

exports.createServer = createServer;
exports.Logger = Logger;

type Options = {
  reporter?: Reporter,
  watch?: boolean,
  nonPersistent: boolean,
};

exports.buildBundle = function(options: Options, bundleOptions: {}) {
  var server = createNonPersistentServer(options);
  return server.buildBundle(bundleOptions)
    .then(p => {
      server.end();
      return p;
    });
};

exports.getOrderedDependencyPaths = function(options: Options, bundleOptions: {}) {
  var server = createNonPersistentServer(options);
  return server.getOrderedDependencyPaths(bundleOptions)
    .then(function(paths) {
      server.end();
      return paths;
    });
};

function enableDebug() {
  // react-packager logs debug messages using the 'debug' npm package, and uses
  // the following prefix throughout.
  // To enable debugging, we need to set our pattern or append it to any
  // existing pre-configured pattern to avoid disabling logging for
  // other packages
  var debugPattern = 'RNP:*';
  var existingPattern = debug.load();
  if (existingPattern) {
    debugPattern += ',' + existingPattern;
  }
  debug.enable(debugPattern);
}

function createServer(options: Options) {
  // the debug module is configured globally, we need to enable debugging
  // *before* requiring any packages that use `debug` for logging
  if (options.verbose) {
    enableDebug();
  }

  const serverOptions = Object.assign({}, options);
  delete serverOptions.verbose;
  if (serverOptions.reporter == null) {
    // It's unsound to set-up the reporter here, but this allows backward
    // compatibility.
    var TerminalReporter = require('./src/lib/TerminalReporter');
    serverOptions.reporter = new TerminalReporter();
  }
  var Server = require('./src/Server');
  return new Server(serverOptions);
}

function createNonPersistentServer(options: Options) {
  const serverOptions = {
    // It's unsound to set-up the reporter here,
    // but this allows backward compatibility.
    reporter: options.reporter == null
      ? require('./src/lib/reporting').nullReporter
      : options.reporter,
    ...options,
    watch: !options.nonPersistent,
  };
  return createServer(serverOptions);
}