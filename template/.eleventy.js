const fs = require("fs");
const markdownItAnchor = require("markdown-it-anchor");
const languages = require('./languages.json')

function fixPath(path) {
  return path.replace(/\/{2,}/g, '/')
}

module.exports = function(eleventyConfig) {
  eleventyConfig.setUseGitIgnore(false);

  const PATH_PREFIX = process.env.B4D_PATH_PREFIX ?? '/'
  const OUTPUT_DIR = 'dist'
  const INPUT_DIR = 'prebuilt'

  const LANGUAGES = {}
  const DEFAULT_LANGUAGE_CODE = languages[0].code ?? 'en'

  languages.forEach(function (language, idx) {
    LANGUAGES[language.code] = {
      ...language,
      path: fixPath(idx === 0 ? `/${PATH_PREFIX}` : `/${PATH_PREFIX}/${language.code}`)
    }
  })

  function getLanguageCodeByURL(url) {
    const urlPath = fixPath(`/${PATH_PREFIX}/${url}`)
    let matchedLanguageCode = DEFAULT_LANGUAGE_CODE

    for (let i = 1; i < Object.entries(LANGUAGES).length; i++) {
      if (urlPath.indexOf(Object.entries(LANGUAGES)[i][1].path) > -1) {
        matchedLanguageCode = Object.entries(LANGUAGES)[i][1].code
        break
      }
    }

    return matchedLanguageCode
  }

  function getCanonicalURL(url) {
    const langCode = getLanguageCodeByURL(url)

    if (langCode === DEFAULT_LANGUAGE_CODE) {
      return url
    }

    const canonicalURL = url.replace(LANGUAGES[langCode].path, LANGUAGES[DEFAULT_LANGUAGE_CODE].path)

    return fixPath(canonicalURL)
  }

  function getAllLanguagesForURL(url, isAbsolute = false) {
    const urlByLang = {}
    const canonicalURL = getCanonicalURL(url)

    if (isAbsolute) {
      urlByLang[DEFAULT_LANGUAGE_CODE] = fixPath(`${LANGUAGES[DEFAULT_LANGUAGE_CODE].base_url}/${canonicalURL}`)
    } else {
      urlByLang[DEFAULT_LANGUAGE_CODE] = canonicalURL
    }
    // extract path from lang
    const relativeURL = canonicalURL.replace(LANGUAGES[DEFAULT_LANGUAGE_CODE], '')

    for (const lang in LANGUAGES) {
      if (lang !== DEFAULT_LANGUAGE_CODE) {
        if (isAbsolute) {
          urlByLang[lang] = fixPath(`${LANGUAGES[lang].base_url}/${relativeURL}`)
        } else {
          urlByLang[lang] = fixPath(`${LANGUAGES[lang].path}/${relativeURL}`)
        }
      }
    }

    return urlByLang
  }

  eleventyConfig.addPlugin(require("@11ty/eleventy-navigation"));

  eleventyConfig.addTransform("minification", function(content) {
    if (this.outputPath.endsWith('.html')) {
      return require('html-minifier').minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
      })
    }
  });

  eleventyConfig.on('beforeBuild', () => {
    fs.mkdirSync(`${INPUT_DIR}/css/`, { recursive: true })
    fs.readFile(`${INPUT_DIR}/css/main.css`, (err, css) => {
      require('postcss')([
        require('postcss-import'),
        require('tailwindcss/nesting'),
        require('tailwindcss')(`${INPUT_DIR}/tailwind.config.js`),
        require('autoprefixer'),
        require('cssnano')({ preset: 'default' })
      ])
        .process(css, { from: `${INPUT_DIR}/css/main.css`, to: `${OUTPUT_DIR}/css/main.min.css` })
        .then(result => {
          fs.mkdirSync(`${OUTPUT_DIR}/css/`, { recursive: true })
          fs.writeFile(`${OUTPUT_DIR}/css/main.min.css`, result.css, (err) => {
            if (err) throw err;
          });
        })
    })
  })

  eleventyConfig.addPassthroughCopy(`${INPUT_DIR}/img`);
  eleventyConfig.addPassthroughCopy(`${INPUT_DIR}/service-worker.js`);
  eleventyConfig.addPassthroughCopy(`${INPUT_DIR}/manifest.json`);
  eleventyConfig.addPassthroughCopy(`${INPUT_DIR}/icons`);

  let markdownLibrary = require("markdown-it")({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      space: true,
      placement: "after",
      class: "no-underline opacity-50 hover:opacity-100",
      symbol: "#",
      level: 1,
    }),
    slugify: eleventyConfig.getFilter("slug")
  });

  eleventyConfig.setLibrary("md", markdownLibrary);

  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync(`${OUTPUT_DIR}/404.html`);

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
    snippet: false,
  });

  eleventyConfig.addFilter("multiLangNav", function(value, url) {
    const pageLanguage = getLanguageCodeByURL(url)

    return value.filter(function(navRecord) {
      const linkLanguage = getLanguageCodeByURL(navRecord.url)

      return linkLanguage === pageLanguage
    })
  });


  eleventyConfig.addShortcode("intl_switcher", function(pageUrl) {
    const pageLang = getLanguageCodeByURL(pageUrl)

    const urlByLang = getAllLanguagesForURL(pageUrl)

    let output = ''

    for (const lang in urlByLang) {
      if (lang !== pageLang) {
        const url = urlByLang[lang]
        const languageLabel = LANGUAGES[lang].label ?? lang.toUpperCase()

        output += `
          <a class="hidden sm:block hover:text-slate-900 hover:dark:text-white transition" href="${url}">
            ${languageLabel}
          </a>
        `
      }
    }

    return output
  })

  eleventyConfig.addShortcode("intl_links", function(pageUrl) {
    const pageLang = getLanguageCodeByURL(pageUrl)

    const urlByLang = getAllLanguagesForURL(pageUrl)

    let output = ''

    for (const lang in urlByLang) {
      const url = urlByLang[lang]
      const languageLabel = LANGUAGES[lang].label ?? lang.toUpperCase()

      output += `
          <a href="${url}" class="flex border-t last:border-b items-center w-full justify-center px-4 h-14 hover:text-slate-900 transition underline-offset-4${lang === pageLang ? ' underline' : ''}">
            ${languageLabel}
          </a>
        `
    }

    return output
  })

  eleventyConfig.addShortcode("hreflang", function(lang_code, url) {
    const pageLang = getLanguageCodeByURL(url)

    const urlByLang = getAllLanguagesForURL(url, true)

    let output = ''

    for (const lang in urlByLang) {
      if (lang !== pageLang) {
        const url = urlByLang[lang]
        const languageLang = LANGUAGES[lang].lang ?? lang

        output += `
        <link rel="alternate" href="${url}" hrefLang="${languageLang}"/>
        `
      }
    }
    return output
  });

  return {
    templateFormats: [ "md", "njk", "html" ],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: PATH_PREFIX,
    dir: {
      input: INPUT_DIR,
      includes: "includes",
      data: "data",
      output: OUTPUT_DIR,
    }
  };
};
