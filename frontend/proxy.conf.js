module.exports = {
  "/graphql-login/": {
    target: "http://backend:8000",
    secure: false,
    changeOrigin: false,
    logLevel: "debug"
  },
  "/graphql/": {
    target: "http://backend:8000",
    secure: false,
    changeOrigin: false,
    logLevel: "debug",
    ws: true
  }
};