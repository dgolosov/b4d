const jet = require("fs-jetpack");
const {getContentFilesByLanguages, copySources, copyOverrides} = require("./utils");

function compose({ contentDir, overrideDir, outDir, srcDir, defaultLanguageCode, isDefaultLanguageInRoot, availableLanguages, overwritePrebuilt, overwriteContentBySources }) {
  try {
    copySources({ srcDir, outDir, overwriteContentBySources })
    console.debug('[b4d] The template files have been copied successfully.')
    copyOverrides({ overrideDir, outDir })
  } catch (e) {
    console.error('[b4d] Failed to copy template files.')
  }

  const filesByLanguages = getContentFilesByLanguages({
    contentDir,
    outDir,
    defaultLanguageCode,
    isDefaultLanguageInRoot
  })

  if (!Object.keys(filesByLanguages).length) {
    console.error(`[b4d] Could not find files.`)
  }

  for (const language in filesByLanguages) {
    if (availableLanguages.length && availableLanguages.indexOf(language) < 0) {
      console.debug(`[b4d] Found ${filesByLanguages[language].length} files with "*.${language}.*" names will be ignored. Language ${language.toUpperCase()} isn\`t available.`)
      delete filesByLanguages[language]
    } else {
      console.debug(`[b4d] Found ${filesByLanguages[language].length} files in language ${language.toUpperCase()}:`)
      for (const file of filesByLanguages[language]) {
        jet.copy(file.filePath, file.targetPath, { overwrite: overwritePrebuilt })
        console.debug(`-  "${file.filePath}" copied to "${file.targetPath}"`)
      }
    }
  }
}

module.exports = compose