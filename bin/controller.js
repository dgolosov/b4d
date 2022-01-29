const B4D = require("./main");
const Logger = require("./logger");

// todo add force option for delete all old temporal files
// todo add watch command
// todo refactor to promise based style
class Controller {
  defaultCommand = 'prebuilt'
  commands = ['prebuilt', 'install']
  commandsAliases = {
    p: 'prebuilt',
    i: 'install',
  }
  constructor(argv) {
    this.logger = new Logger('b4d')

    const { logger, validateUnknownArgument, commands, commandsAliases } = this

    this.args = require('minimist')(argv, {
      string: [
        "templateDir",
        "contentDir",
        "prebuiltDir",
        "languagesPath",
      ],
      boolean: [
        "version",
        "help",
        "ignoreOverride"
      ],
      alias: { h: 'help', v: 'version' },
      unknown: function(unknownArgument) {
        const isValidArg = validateUnknownArgument(unknownArgument, commands, commandsAliases)
        if (!isValidArg) {
          logger.error(`We don’t know what '${unknownArgument}' is. Use --help to see the list of supported commands.`)
          process.exit(1)
        }
      },
    })
  }

  validateUnknownArgument(arg, commands, aliases) {
    const isAvailableCommand = commands.indexOf(arg) > -1
    const isValidAlias = commands.indexOf(aliases[arg]) > -1

    return isAvailableCommand || isValidAlias
  }

  validateArgs() {
    if (this.args._.length > 1) {
      this.logger.e('You can only use one command at a time. Use --help to see the list of supported commands.')
      process.exit(1)
    }
  }

  getCommand() {
    const rawCommand = this.args._[0]

    if (!rawCommand) {
      return this.defaultCommand
    }

    if (this.commands.indexOf(rawCommand) > -1) {
      return rawCommand
    } else {
      return this.commandsAliases[rawCommand] ?? this.defaultCommand
    }
  }

  start() {
    this.validateArgs()

    const command = this.getCommand()

    const b4d = new B4D(this.args, this.logger)

    if (this.args.version) {
      b4d.printVersion()
    } else if (this.args.help) {
      b4d.printHelp()
    } else if (command === 'install') {
      b4d.install().then(function() {
        b4d.compose()
      })
    } else if (command === 'prebuilt') {
      b4d.compose()
    }
  }
}

module.exports = Controller
