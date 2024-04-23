import fs from "fs";
import child_process from "child_process";
import async from "async";
import {v1 as uuidv1} from "uuid";

export default function (buffer, tmpFolder, callback) {
  let u = uuidv1();
  let encodedFilepath = `${tmpFolder}/${u}.p7m`;
  let decodedFilepath = `${tmpFolder}/${u}`;
  let decodedContent = null;
  async.series(
    [
      function (cb) {
        fs.writeFile(encodedFilepath, buffer, function (err) {
          return cb(err);
        });
      },
      function (cb) {
        child_process.exec(
          `openssl smime -verify -noverify -in ${encodedFilepath} -inform DER -out ${decodedFilepath}`,
          function (err, stdout, stderr) {
            if (err) {
              return cb(err);
            }
            if (stderr && stderr.trim() !== "Verification successful") {
              return cb(stderr);
            }
            return cb();
          }
        );
      },
      function (cb) {
        fs.readFile(decodedFilepath, function (err, res) {
          if (err) {
            return cb(err);
          }
          decodedContent = res;
          return cb();
        });
      },
    ],
    function (err) {
      if (fs.existsSync(decodedFilepath)) {
        fs.unlinkSync(decodedFilepath);
      }
      if (fs.existsSync(encodedFilepath)) {
        fs.unlinkSync(encodedFilepath);
      }
      return callback(err, decodedContent);
    }
  );
}
