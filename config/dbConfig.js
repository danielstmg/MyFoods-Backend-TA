var fire = require("firebase-admin");

var serviceAccount = require("../db-recepku-firebase-adminsdk-s0rfd-3c2986487d.json");

fire.initializeApp({
  credential: fire.credential.cert(serviceAccount)
});

//export module
module.exports = fire;
