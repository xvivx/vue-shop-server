import webpack from 'webpack';

import chalk from 'chalk';


import webpackConfig from './webpack.config';


webpack(webpackConfig, (error, stats) => {
  if (error) {
    console.log(chalk.red(`这是webpack相关错误, 并非编译错误, 比如配置错误`));
    console.error(error.stack || error);
    
    if (error.details) {
      console.error(error.details);
    }

    return;
  }

  var info = stats.toJson();

  if (stats.hasErrors()) {
    info.errors.forEach(({ error }) => console.error(error.message || error));
    return;
  }

  if (stats.hasWarnings()) {
    info.warnings.forEach(warning => {
      console.warn(chalk.yellow(warning.match(/^.*$/mg).slice(0, 2).join(' REASON: ')));
    })
  }
});