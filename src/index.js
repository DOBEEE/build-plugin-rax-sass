const path = require("path");
const { WEB, WEEX, NODE, KRAKEN, MINIAPP, WECHAT_MINIPROGRAM } = require('./constants');

const cwd = process.cwd();
const resolve = (src) => path.resolve(cwd, "node_modules", src);
const configPath = resolve("build-plugin-rax-app/src/config");
const MiniCssExtractPlugin = require(resolve('mini-css-extract-plugin/dist/cjs.js'));

const webStandardList = [
  WEB,
];

const inlineStandardList = [
  WEEX, KRAKEN,
];

const miniappStandardList = [
  MINIAPP,
  WECHAT_MINIPROGRAM,
];

function setCSSRule(configRule, context, value, taskName) {
  const { userConfig } = context;
  const { extraStyle = {} } = userConfig;
  const { cssModules = {} } = extraStyle;
  const { modules, resourceQuery } = cssModules;
  const isInlineStandard = inlineStandardList.includes(taskName);
  const isWebStandard = webStandardList.includes(taskName);
  const isMiniAppStandard = miniappStandardList.includes(taskName);
  const isNodeStandard = taskName === NODE;

  // enbale inlineStyle
  if (value) {
    if (isInlineStandard || isMiniAppStandard) {
      configInlineStyle(configRule);
    } else {
      // Only web need transfrom rpx to vw
      configInlineStyle(configRule)
        .end()
        .use('postcss')
        .loader('postcss-loader')
        .options({
          config: {
            path: configPath,
            ctx: {
              type: 'inline'
            },
          },
        });
    }
  } else {
    if (isWebStandard || isMiniAppStandard) {
      const postcssConfig = {
        config: {
          path: configPath,
          ctx: {
            type: isWebStandard ? 'web' : 'miniapp'
          },
        },
      };
      configRule
        .use('minicss')
        .loader(MiniCssExtractPlugin.loader)
        .end()
        .use('css')
        .loader('css-loader')
        .end()
        .use('postcss')
        .loader('postcss-loader')
        .options(postcssConfig)
        .end()
        .use('css')
        .loader('css-loader')
        .options({ modules })
        .end()
        .use('postcss')
        .loader('postcss-loader')
        .options(postcssConfig);
    } else if (isInlineStandard) {
      configInlineStyle(configRule);
    } else if (isNodeStandard) {
      // Do not generate CSS file, it will be built by web complier
      configRule
        .use('ignorecss')
        .loader('null-loader')
        .end();
    }
  }
}

function configInlineStyle(configRule) {
  return configRule
    .use('css')
    .loader('stylesheet-loader')
    .options({
      transformDescendantCombinator: true,
    });
}


function setTaskConfig (taskName, { onGetWebpackConfig, context }) {
  onGetWebpackConfig(taskName, (config) => {
    const { userConfig } = context;
    const { inlineStyle, publicPath } = userConfig;

    setCSSRule(config.module.rule('sass').test(/\.scss?$/), context, inlineStyle, taskName);

    if(inlineStandardList.includes(taskName) || inlineStyle) {
      config.module.rule('sass')
        .use('sass')
        .loader('sass-loader');
    } else if ((webStandardList.includes(taskName) || miniappStandardList.includes(taskName)) && !inlineStyle) {
      config.module.rule('sass')
        .oneOf('raw')
        .use('sass')
        .loader('sass-loader')
        .end()
        .end()
        .oneOf('normal')
        .use('sass')
        .loader('sass-loader');

      config.plugin('minicss')
        .use(MiniCssExtractPlugin, [{
          filename: `${publicPath.startsWith('.') ? '' : `${taskName}/`}[name].css`,
          ignoreOrder: true
        }]);
    }
  });
}



// sassPlugin.js
module.exports = (api) => {
  const taskList = [WEB, WEEX, NODE, KRAKEN, MINIAPP, WECHAT_MINIPROGRAM]
  taskList.forEach(taskName => setTaskConfig(taskName, api))
}