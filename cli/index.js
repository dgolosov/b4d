#!/usr/bin/env node

const compose = require("./compose.js");
const init = require("./init.js");
const { printVersion, printHelp } = require("./info.js");

const args = require('minimist')(process.argv.slice(2), {
  boolean: [
    "version",
    "help",
    "init",
  ],
  unknown: function (unknownArgument) {
    console.error(
      `[b4d] We don’t know what '${unknownArgument}' is. Use --help to see the list of supported commands.`
    )
    process.exit()
  },
})

const defaultLanguageCode = 'ru'
const availableLanguages = ['ru', 'en']
const isDefaultLanguageInRoot = true
const overwritePrebuilt = true
const overwriteContentBySources = false
const srcDir = 'node_modules/b4d/src'
const contentDir = 'content'
const overrideDir = 'overrides'
const outDir = 'prebuilt'

if (args.help) {
  printHelp()
} else if (args.version) {
  printVersion()
} else if (args.init) {
  init({
    outDir
  }).then(function () {
    compose({
      overrideDir,
      defaultLanguageCode,
      availableLanguages,
      isDefaultLanguageInRoot,
      overwritePrebuilt,
      overwriteContentBySources,
      contentDir,
      outDir,
      srcDir,
    })
  })
} else {
  compose({
    overrideDir,
    defaultLanguageCode,
    availableLanguages,
    isDefaultLanguageInRoot,
    overwritePrebuilt,
    overwriteContentBySources,
    contentDir,
    outDir,
    srcDir,
  })
}

