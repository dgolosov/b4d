const jet = require("fs-jetpack");
const {getContentFilesByLanguages, copySources} = require("./utils");

function compose({ contentDir, outDir, srcDir, defaultLanguageCode, isDefaultLanguageInRoot, availableLanguages, overwritePrebuilt, overwriteContentBySources }) {
  try {
    copySources({ srcDir, outDir, overwriteContentBySources })
    console.debug('[eblog] The template files have been copied successfully.')
  } catch (e) {
    console.error('[eblog] Failed to copy template files.')
  }

  const filesByLanguages = getContentFilesByLanguages({
    contentDir,
    outDir,
    defaultLanguageCode,
    isDefaultLanguageInRoot
  })

  if (!Object.keys(filesByLanguages).length) {
    console.error(`[eblog] Could not find files.`)
  }

  for (const language in filesByLanguages) {
    if (availableLanguages.length && availableLanguages.indexOf(language) < 0) {
      console.debug(`[eblog] Found ${filesByLanguages[language].length} files with "*.${language}.*" names will be ignored. Language ${language.toUpperCase()} isn\`t available.`)
      delete filesByLanguages[language]
    } else {
      console.debug(`[eblog] Found ${filesByLanguages[language].length} files in language ${language.toUpperCase()}:`)
      for (const file of filesByLanguages[language]) {
        jet.copy(file.filePath, file.targetPath, { overwrite: overwritePrebuilt })
        console.debug(`-  "${file.filePath}" copied to "${file.targetPath}"`)
      }
    }
  }
}

module.exports = compose
