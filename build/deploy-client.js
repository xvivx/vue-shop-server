const fs = require('fs');
const path = require('path');
const fsStatSync = fs.statSync;
const oss = require('../app/ali-oss/oss');
const CODE_PATH = path.resolve(`vue-shop/dist`);

function walkFile(entry, dirs) {
  const paths = fs.readdirSync(entry);

  paths.forEach(function(item) {
    var currentDir = entry + '/' + item;

    const stat = fsStatSync(currentDir);

    if (stat.isFile()) {
      dirs.push(currentDir);
    } else if (stat.isDirectory()) {
      walkFile(currentDir, dirs);
    }
  });

  return dirs;
}

export default async function() {
  var dirs = walkFile(CODE_PATH, []);
  var promises = [];

  // await oss.deleteMulti(dirs.map((item) => item.replace(CODE_PATH + '/', '')));

  // console.log(`清理完成`);

  dirs.forEach((dir) => {
    var promise = oss.upload(
      dir.replace(CODE_PATH + '/', ''),
      fs.createReadStream(dir)
    );

    promises.push(promise);
  });

  await Promise.all(promises);
  console.log(`上传完成`);
}
