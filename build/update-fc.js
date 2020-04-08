import fs from 'fs';
import FCClient from '@alicloud/fc2';
import { functionName, serviceName, account, fcOptions } from '../credentials';

var client = new FCClient(account, fcOptions);

export default function(zipPath) {
  return client.updateFunction(serviceName, functionName, {
    code: {
      zipFile: fs.readFileSync(zipPath, 'base64')
    }
  });
}
