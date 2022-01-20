const jet = require("fs-jetpack");

function getContentFilesByLanguages({ contentDir, defaultLanguageCode, outDir, excludePaths, isDefaultLanguageInRoot }) {
  if (!(jet.exists(contentDir) === 'dir')) {
    console.error(`[b4d] Could not find directory: "${contentDir}".`)
    return {}
  }

  const languages = {}
  const excludes = excludePaths ? excludePaths.map(function(path) {
    return `!${path}`
  }) : '*'

  const contentFiles = jet.find(contentDir, { matching: excludes })

  for (const filePath of contentFiles) {
    const fileRecord = contentFileToLanguageFileRecord({
      filePath,
      defaultLanguageCode,
      contentDir,
      outDir,
      isDefaultLanguageInRoot
    })

    if (languages[fileRecord.languageCode]) {
      languages[fileRecord.languageCode].push(fileRecord)
    } else {
      languages[fileRecord.languageCode] = [fileRecord]
    }
  }

  return languages
}

function contentFileToLanguageFileRecord({ filePath, defaultLanguageCode, isDefaultLanguageInRoot, contentDir, outDir }) {
  const PATH_WITH_LANG_EXT_REGEXP = /.+\.(.+)\..+$/g

  const result = PATH_WITH_LANG_EXT_REGEXP.exec(filePath)

  let targetPath = filePath
  let languageCode = defaultLanguageCode

  if (result) {
    languageCode = result[1]
    targetPath = targetPath.replace(`.${languageCode}`, '')
  }

  const isDefaultLanguage = languageCode === defaultLanguageCode

  if (isDefaultLanguage && isDefaultLanguageInRoot) {
    targetPath = targetPath.replace(contentDir, `${outDir}/`)
  } else {
    targetPath = targetPath.replace(contentDir, `${outDir}/${languageCode}/`)
  }

  return {
    filePath: filePath,
    targetPath: fixPath(targetPath),
    languageCode: languageCode,
  }
}

function fixPath(path) {
  return path.replace('//', '/')
}

function copySources({ srcDir, outDir }) {
  jet.copy(srcDir, outDir, { overwrite: true })
}

module.exports = {
  getContentFilesByLanguages,
  copySources,
}
