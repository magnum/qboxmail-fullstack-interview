const env = {
  development: {
    be_url: "http://" + window.location.href.split("/")[2].split(":")[0] + ":5000", //"http://localhost:5000",
    roundcube_url: "",
  },
};

let environment = process.env.TARGET_ENV || "development";

export default env[environment];
