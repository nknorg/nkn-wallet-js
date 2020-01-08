module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      dist: {
        files: {
          'dist/nkn-wallet.js': [ 'lib/wallet.js' ]
        },
        options: {
          exclude: ['crypto'],
          browserifyOptions: {
            standalone: 'nkn-wallet'
          }
        }
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
        sourceMapName: 'dist/nkn-wallet.min.js.map'
      },
      dist: {
        files: {
          'dist/nkn-wallet.min.js' : [ 'dist/nkn-wallet.js' ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');

  grunt.registerTask('dist', ['browserify', 'uglify']);
};
