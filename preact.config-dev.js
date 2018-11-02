export default (config, env, helpers) => {
    // disable spread syntax rewriting
    // let {rule} = helpers.getLoadersByName(config, 'babel-loader')[0];
    // rule.options.plugins = rule.options.plugins.filter(v => {
    //     if (typeof v === 'string') {
    //         console.log(v.indexOf('object-rest-spread'));
    //         return v.indexOf('object-rest-spread') === -1;
    //     }
    //     return true;
    // });

    // // use the public path in your app as 'process.env.PUBLIC_PATH'
    config.plugins.push(
        new helpers.webpack.DefinePlugin({
            'process.env.DEV': 1,
        })
    );

    // let {index} = helpers.getPluginsByName(config, 'UglifyJsPlugin')[0];
    // config.plugins.splice(index, 1);

    // let {rule} = helpers.getLoadersByName(config, 'babel-loader')[0];
    // rule.options.presets[0][1] = {
    //     loose: true,
    //     uglify: false,
    //     modules: false,
    //     targets: {browsers: ['last 1 chrome versions']},
    //     exclude: ['transform-regenerator', 'transform-es2015-typeof-symbol'],
    // };
};
