var path = require('path');

module.exports = {
    entry: './DragBlock.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'DragBlock.js',
        library: {
            type: 'module'
        }
    },
    experiments: {
        outputModule: true
    },
    mode: "production",
};