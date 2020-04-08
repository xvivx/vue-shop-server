module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'commonjs',
        targets: {
          node: '10.19.0'
        }
      }
    ]
  ],
  ignore: ['node_modules']
};
