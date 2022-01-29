#!/usr/bin/env node

const Controller = require('./controller.js')

const controller = new Controller(process.argv.slice(2))

controller.start()
