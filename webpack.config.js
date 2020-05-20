module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: __dirname + '/lib',
    filename: 'index.js'
  }
}