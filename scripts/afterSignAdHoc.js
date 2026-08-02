const { execFile } = require('child_process');
const path = require('path');

module.exports = async function afterSignAdHoc(context) {
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);

  await new Promise((resolve, reject) => {
    execFile(
      'codesign',
      ['--deep', '--force', '--sign', '-', appPath],
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`codesign ad-hoc falló para ${appPath}: ${stderr || error.message}`));
          return;
        }
        resolve();
      }
    );
  });
};
