import path from 'path';
import webpack from 'webpack';
import gulp, { series, parallel } from 'gulp';
import gulpZip from 'gulp-zip';
import del from 'delete';
import chalk from 'chalk';
import updateFc from './build/update-fc';
import uploadClient from './build/deploy-client';

import webpackConfig from './build/webpack.config';

function webpackTask(cb) {
  webpack(webpackConfig, (error, stats) => {
    if (error) {
      console.log(chalk.red(`这是webpack相关错误, 并非编译错误, 比如配置错误`));
      console.error(error.stack || error);

      if (error.details) {
        console.error(error.details);
      }

      cb(new Error(`webpack运行出错`));
      return;
    }

    var info = stats.toJson();

    if (stats.hasErrors()) {
      info.errors.forEach((error) => console.error(chalk.red(error)));

      cb(new Error(`webpack编译出错`));
      return;
    }

    if (stats.hasWarnings()) {
      info.warnings.forEach((warning) => {
        var info = warning
          .match(/^.*$/gm)
          .slice(0, 2)
          .join(' __REASON__: ');

        console.warn(chalk.yellow(info));
      });
    }

    cb();
  });
}

// 暂时不使用了
export function copy() {
  return gulp.src(`app/static/**/*`).pipe(gulp.dest('dist/static'));
}

// 压缩打包资源准备上传
export function zip() {
  return gulp
    .src([`dist/server.js`, `dist/+(static)/**/*`])
    .pipe(gulpZip(`dist.zip`))
    .pipe(gulp.dest(`dist`));
}

// 清理任务
gulp.task(`clean`, function(cb) {
  del([`dist/**/*`], cb);
});

// webpack打包服务端代码
gulp.task(`build`, series(parallel(webpackTask), zip));

// 上传阿里云函数计算
gulp.task(`upload:server`, function() {
  return updateFc(path.resolve(`dist/dist.zip`)).then((resp) =>
    console.log(`${resp.data.functionName}函数上传成功`)
  );
});

// 上传客户端代码
gulp.task(`upload:client`, uploadClient);
