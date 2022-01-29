#!/usr/bin/env node

const Controller = require('./controller.js')

const controller = new Controller()

controller.initialize()
controller.start()
