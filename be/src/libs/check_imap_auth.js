import _ from "lodash";
import QboxImap from "qboxmail-imap";

export default function (app) {
  return {
    validate_password: function (ip, user, password, callback) {
      let imapdata = _.cloneDeep(app.get("config").imap_login_params);
      imapdata.user = user;
      imapdata.password = password;
      // imapdata.id = {
      //   "x-originating-ip": ip,
      // };

      let connection = new QboxImap(imapdata);
      connection.once("ready", function () {
        //imapmodule.send_imap_id(connection);
        // app.logger.debug(`Password OK for user ${imapdata.user}`);
        connection.end();
        return callback();
      });

      connection.once("error", function (err) {
        app.logger.error(`Wrong password for user ${imapdata.user}`);
        connection.end();
        return callback(err);
      });

      connection.once("end", function () {
        // close the connection!
      });

      connection.connect();
    },
  };
}
