console.log(JSON.stringify(process.env, null, 2))
const appBasePath = process.env.APP_BASE_PATH || '/async'

module.exports = appBasePath;