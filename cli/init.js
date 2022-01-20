const jet = require("fs-jetpack");
const { spawn } = require("child_process");

function init({ outDir }) {
  updateUserPackageJSON({ outDir })

  return installDependencies()
}

function updateUserPackageJSON({ outDir }) {
  try {
    const userPkg = jet.read('package.json', 'json')
    const servicePkg = require('../package.json')

    const serviceOnlyDependencies = [
      "@commitlint/cli",
      "@commitlint/config-conventional",
      "husky",
      "husky-init",
      "semantic-release",
    ]

    for (const dependency in servicePkg.devDependencies) {
      if (serviceOnlyDependencies.indexOf(dependency) < 0) {
        userPkg.devDependencies[dependency] = servicePkg.devDependencies[dependency]
      }
    }

    userPkg.scripts = {
      ...(userPkg.scripts ?? {}),
      "serve": `npx @11ty/eleventy --config=${outDir}/.eleventy.js --serve`,
      "build": `npx @11ty/eleventy --config=${outDir}/.eleventy.js`,
      "debug": `DEBUG=* npx @11ty/eleventy --config=${outDir}/.eleventy.js --dryrun`,
      "prebuilt": "npx eblog"
    }

    jet.write('package.json', userPkg)
    console.debug('[eblog] Your package.json has been updated.')
  } catch (e) {
    console.error('[eblog] Unable to update your package.json')
  }
}

function installDependencies() {
  return new Promise(((resolve, reject) => {
    console.log('[eblog] Install dependencies...')
    const npm = spawn("npm", ["install"]);

    npm.stdout.on("data", data => {
      console.log(`${data}`);
    });

    npm.stderr.on("data", data => {
      console.log(`${data}`);
    });

    npm.on('error', (error) => {
      console.log(`${error.message}`);
    });

    npm.on("close", code => {
      if (code === 0) {
        console.log(`[eblog] Dependencies successfully installed.`);
        resolve()
      } else {
        console.log(`[eblog] Something went wrong :(`);
        reject()
      }
    });
  }))
}

module.exports = init
