module.exports = {
    configureWebpack: {
        devServer: {
            headers: { "Access-Control-Allow-Origin": "*" },
            hot: false,
            liveReload: false
        }
    }
};