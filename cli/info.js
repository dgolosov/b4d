function printHelp() {
  console.log(`
  [b4d] Usage:
  npx b4d   
  
  --init      Install dependencies and compose project
  --help      Help
  --version   Version of package
  `)
}

function printVersion() {
  const servicePkg = require('../package.json')

  console.log(servicePkg.version)
}

module.exports = {
  printHelp,
  printVersion,
}
