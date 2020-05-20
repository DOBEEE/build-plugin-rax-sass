const path = require("path")

// sassPlugin.js
module.exports = ({ onGetWebpackConfig }) => {
  onGetWebpackConfig((config) => {
    config.module
      .rule('scss')
      .test(/\.scss$/)
      .use('stylesheet-loader').loader('stylesheet-loader').options({ transformDescendantCombinator: true }).end()
      .use('postcss-loader').loader('postcss-loader').options({  
        path: path.resolve("./node_modules/build-plugin-rax-app/src/config"),
        ctx: {
          type: "inline"
        }
      }).end()
      .use('sass-loader').loader('sass-loader')
      
  });
}