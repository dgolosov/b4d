const jet = require("fs-jetpack");
const {spawn} = require("child_process");

class B4D {
  constructor(args, logger) {
    this.log = logger
    this.defaultLanguageCode = 'en'
    this.availableLanguages = []
    this.intlData = {}
    this.isDefaultLanguageInRoot = true
    this.servicePkg = require('../package.json')
    this.skipTemplateOverride = args.ignoreOverride ?? false
    this.deletePrebuiltDir = args.force ?? false

    // paths
    this.templateDir = args.templateDir ?? 'node_modules/b4d/template'
    this.templateOverrideDir = 'overrides'
    this.contentDir = args.contentDir ?? 'content'
    this.languagesConfigPath = args.languagesPath ?? `${this.contentDir}/languages.json`
    this.contentIgnorePaths = undefined
    this.outDir = args.prebuiltDir ?? 'prebuilt'
  }

  install() {
    this.updateUserPackageJSON()

    return this.installDependencies()
  }

  getScripts() {
    return {
      "serve": `npx @11ty/eleventy --config=${this.outDir}/.eleventy.js --serve`,
      "build": `npx @11ty/eleventy --config=${this.outDir}/.eleventy.js`,
      "debug": `DEBUG=* npx @11ty/eleventy --config=${this.outDir}/.eleventy.js --dryrun`,
      "prebuilt": "npx b4d prebuilt"
    }
  }

  getTemplateDevDependencies() {
    const templateDevDependencies = this.servicePkg.devDependencies
    const ignoreDependencies = [
      "@commitlint/bin",
      "@commitlint/config-conventional",
      "husky",
      "husky-init",
      "semantic-release",
    ]

    const devDependencies = {}

    for (const dependencyName in templateDevDependencies) {
      if (ignoreDependencies.indexOf(dependencyName) < 0) {
        devDependencies.devDependencies[dependencyName] = templateDevDependencies[dependencyName]
      }
    }

    return devDependencies
  }

  getLanguages() {
    if (!jet.exists(this.languagesConfigPath) === 'file') {
      this.log.e(`Languages config file not found`)
      process.exit(1)
    }

    const languages = jet.read(this.languagesConfigPath, 'json')

    if (languages.length) {
      this.defaultLanguageCode = languages[0].code

      const availableLanguages = []
      const intlData = {}

      languages.forEach(function(language) {
        availableLanguages.push(language.code)
        intlData[language.code] = language
      })

      this.availableLanguages = availableLanguages
      this.intlData = intlData
    }
  }

  updateUserPackageJSON() {
    try {
      const userPkg = jet.read('package.json', 'json')

      const scripts = this.getScripts()
      const devDependencies = this.getTemplateDevDependencies()

      jet.write('package.json', {
        ...userPkg,
        scripts: {
          ...(userPkg.scripts ?? {}),
          ...scripts,
        },
        devDependencies: {
          ...(userPkg.devDependencies ?? {}),
          ...devDependencies,
        }
      })

      this.log.i('Your package.json has been updated.')
    } catch (e) {
      this.log.e('Unable to update your package.json')
    }
  }

  installDependencies() {
    return new Promise(((resolve, reject) => {
      this.log.i('Install dependencies...')

      const npm = spawn("npm", ["install"]);

      npm.stdout.on("data", data => {
        this.log.v(`${data}`);
      });

      npm.stderr.on("data", data => {
        this.log.e(`${data}`);
      });

      npm.on('error', (error) => {
        this.log.e(`${error.message}`);
      });

      npm.on("close", code => {
        if (code === 0) {
          this.log.i(`Dependencies successfully installed.`);
          resolve()
        } else {
          this.log.e(`Something went wrong :(`);
          reject()
        }
      });
    }))
  }

  compose() {
    this.getLanguages()
    this.copyTemplateFiles()

    const filesByLanguages = this.getContentFilesByLanguages()

    if (!Object.keys(filesByLanguages).length) {
      this.log.e('Could not find files')
    }

    for (const language in filesByLanguages) {
      if (this.availableLanguages.length && this.availableLanguages.indexOf(language) < 0) {
        this.log.w(`Found ${filesByLanguages[language].length} files with "*.${language}.*" names will be ignored. Language ${language.toUpperCase()} isn\`t available.`)
        delete filesByLanguages[language]
      } else {
        this.log.v(`Found ${filesByLanguages[language].length} files in language ${language.toUpperCase()}:`)

        for (const file of filesByLanguages[language]) {
          jet.copy(file.filePath, file.targetPath, { overwrite: true })
          this.log.v(`"${file.filePath}" copied to "${file.targetPath}"`)
        }

        this.createIntlVariableForLangScope(language)
      }
    }
  }

  createIntlVariableForLangScope(langCode) {
    let pathFile, data
    if (langCode === this.defaultLanguageCode) {
      pathFile = this.normalizePath(`${this.getOutPathByLang(langCode)}/data/intl.json`)
      data = this.intlData[langCode]
    } else {
      pathFile = this.normalizePath(`${this.getOutPathByLang(langCode)}/${langCode}.json`)
      data = { intl: this.intlData[langCode] }
    }

    jet.write(pathFile, data)
  }

  getContentFilesByLanguages() {
    if (!(jet.exists(this.contentDir) === 'dir')) {
      // todo extract validation input params in separate method
      this.log.e(`Could not find directory: "${this.contentDir}".`)
      return {}
    }

    const languages = {}
    // todo add contentIgnorePaths param in HELP
    const excludes = this.contentIgnorePaths ? this.contentIgnorePaths.map(function(path) {
      return `!${path}`
    }) : '*'

    const contentFiles = jet.find(this.contentDir, { matching: excludes })

    for (const filePath of contentFiles) {
      const fileRecord = this.contentFileToLanguageFileRecord(filePath)

      if (languages[fileRecord.languageCode]) {
        languages[fileRecord.languageCode].push(fileRecord)
      } else {
        languages[fileRecord.languageCode] = [fileRecord]
      }
    }

    return languages
  }

  contentFileToLanguageFileRecord(filePath) {
    const PATH_WITH_LANG_EXT_REGEXP = /.+\.(.+)\..+$/g

    const result = PATH_WITH_LANG_EXT_REGEXP.exec(filePath)

    let targetPath = filePath
    let languageCode = this.defaultLanguageCode

    if (result) {
      languageCode = result[1]
      targetPath = targetPath.replace(`.${languageCode}`, '')
    }

    targetPath = targetPath.replace(this.contentDir, this.getOutPathByLang(languageCode))

    return {
      filePath: filePath,
      targetPath: this.normalizePath(targetPath),
      languageCode: languageCode,
    }
  }

  getOutPathByLang(lang) {
    if (lang === this.defaultLanguageCode && this.isDefaultLanguageInRoot) {
      return this.normalizePath(`${this.outDir}/`)
    }

    return this.normalizePath(`${this.outDir}/${lang}/`)
  }

  printHelp() {
    this.log.i([
      'Usage:',
      '   npx b4d',
      '   npx b4d install    Install template dependencies & update package.json',
      '   npx b4d prebuilt   Pre-built',
      '',
      'Options:',
      '   -h, --help          Print the list of supported commands',
      '   -v, --version       Print installed version of b4d',
      '   --ignoreOverride    Skip overriding files in template',
      '   --templateDir       Custom path to template directory',
      '   --contentDir        Custom path to content directory',
      '   --prebuiltDir       Custom path to prebuilt directory',
      '   --languagesPath     Custom path to languages.json file',
      '   -f, --force         Delete prebuilt directory before pre-built',
    ].join("\n"))
  }

  copyTemplateFiles() {
    if (this.deletePrebuiltDir && jet.exists(this.outDir) === 'dir') {
      jet.remove(this.outDir)
    }
    try {
      this.copyDir(this.templateDir, this.outDir)
      this.log.v('template files have been copied successfully')

      if (!this.skipTemplateOverride && jet.exists(this.templateOverrideDir) === 'dir') {
        this.copyDir(this.templateOverrideDir, this.outDir)
        this.log.v('template override files have been copied successfully')
      }
    } catch (e) {
      this.log.e('failed to copy template files')
    }
  }

  copyDir(from, to) {
    if (jet.exists(from) === 'dir') {
      jet.copy(from, to, { overwrite: true })
    }
  }

  printVersion() {
    console.log(this.servicePkg.version)
  }

  normalizePath(path) {
    return path.replace(/\/{2,}/g, '/')
  }
}

module.exports = B4D
