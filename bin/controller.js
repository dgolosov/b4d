const B4D = require("./main");
const Logger = require("./logger");

class Controller {
  initialize() {
    this.logger = new Logger('b4d')
    this.args = require('minimist')(process.argv.slice(2), {
      boolean: [
        "version",
        "help",
        "init",
      ],
      unknown: this.onUnknownArgument,
    })
  }

  start() {
    const b4d = new B4D(this.args, this.logger)

    if (this.args.help) {
      b4d.printHelp()
    } else if (this.args.version) {
      b4d.printVersion()
    } else if (this.args.init) {
      b4d.install().then(function() {
        b4d.compose()
      })
    } else {
      b4d.compose()
    }
  }

  onUnknownArgument(unknownArgument) {
    this.logger.error(`We don’t know what '${unknownArgument}' is. Use --help to see the list of supported commands.`)
    process.exit()
  }
}

module.exports = Controller
