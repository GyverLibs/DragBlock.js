module.exports = {
    entry: './DragBlock.js',
    output: {
        path: __dirname,
        filename: 'DragBlock.min.js',
        library: {
            type: 'module'
        }
    },
    experiments: {
        outputModule: true
    },
    mode: "production",
};