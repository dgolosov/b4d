class Logger {
  constructor(appName) {
    this.appName = appName
  }

  print(message, level = 'info') {
    const prefix = `[${this.appName}] `
    if (level === 'info' || level === 'l') {
      console.log(prefix, message)
    } else if (level === 'verbose' || level === 'v') {
      console.debug(prefix, message)
    } else if (level === 'warning' || level === 'w') {
      console.warn(prefix, message)
    } else if (level === 'error' || level === 'e') {
      console.error(prefix, message)
    }
  }

  info(message) {
    this.print(message, 'info')
  }

  i(message) {
    this.info(message)
  }

  verbose(message) {
    this.print(message, 'verbose')
  }

  v(message) {
    this.verbose(message)
  }

  warning(message) {
    this.print(message, 'warning')
  }

  w(message) {
    this.warning(message)
  }

  error(message) {
    this.print(message, 'error')
  }

  e(message) {
    this.error(message)
  }
}

module.exports = Logger
