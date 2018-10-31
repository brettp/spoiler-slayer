export default (config, env, helpers) => {
    // config.output.publicPath = '/options/';

    // // use the public path in your app as 'process.env.PUBLIC_PATH'
    // config.plugins.push(
    //     new helpers.webpack.DefinePlugin({
    //         'process.env.PUBLIC_PATH': JSON.stringify(config.output.publicPath || '/'),
    //     })
    // );

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
