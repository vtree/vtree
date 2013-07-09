'use strict';

module.exports = function (grunt) {
  // load all grunt tasks
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-compress');


  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      version: '<%= pkg.version %>',
      banner:
        '// Vtree (javascript tree component)\n' +
        '// ----------------------------------\n' +
        '// v<%= pkg.version %>\n' +
        '//\n' +
        '// Copyright (c)<%= grunt.template.today("yyyy") %> Loic Ginoux, Vyre ltd.\n' +
        '//\n' +
        '// Licensed under the Apache License, Version 2.0 (the "License");\n' +
        '// you may not use this file except in compliance with the License.\n' +
        '// You may obtain a copy of the License at\n' +
        '//\n' +
        '// http://www.apache.org/licenses/LICENSE-2.0\n' +
        '//\n' +
        '// Unless required by applicable law or agreed to in writing, software\n' +
        '// distributed under the License is distributed on an "AS IS" BASIS,\n' +
        '// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n' +
        '// See the License for the specific language governing permissions and\n' +
        '// limitations under the License.\n' +
        '//\n' +
        '\n'
    },
    compress: {
      dist: {
        options: {
          archive: 'vtree_<%= pkg.version %>.zip'
        },
        files: [
          {src: ['dist/**']},
          {src: ['examples/**']},
          {src: ['libs/**']},
        ]
      }
    },
    clean: ["dist/*"],
    cssmin: {
      dist: {
        files: {
          'dist/style/vtree.min.css': [
            'src/style/vtree.css'
          ]
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/js/vtree.min.js': ['dist/js/vtree.js']
        }
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: "src/",
          dest: 'dist/',
          src: [
            'style/**/*'
          ]
        }]
      }
    },
    concat: {
      options: {
        banner: "<%= meta.banner %>"
      },
      dist: {
        files: {
          'dist/js/vtree.js': [
            'src/core/vtree.utils.js',
            'src/core/vtree.manager.js',
            'src/core/vtree.tree.js',
            'src/core/vtree.nodeStore.js',
            'src/core/vtree.node.js',
            'src/plugins/vtree.ajax_loading.js',
            'src/plugins/vtree.checkbox.js',
            'src/plugins/vtree.cookie.js',
          ]
        }
      }
    },
    jasmine : {
      dist:{
        src : [
          'src/core/vtree.utils.js',
          'src/core/vtree.manager.js',
          'src/core/vtree.tree.js',
          'src/core/vtree.nodeStore.js',
          'src/core/vtree.node.js',
          'src/plugins/vtree.ajax_loading.js',
          'src/plugins/vtree.checkbox.js',
          'src/plugins/vtree.cookie.js',
        ],
        options : {
          // uncomment this option to debug the tests
          // when running grunt test, go to localhost:9000 to get
          // a web inspector
          // running __run() in console will run tests
          // see https://github.com/ekonijn/grunt-require-demo/blob/master/doc/debugging-jasmine.md
          // '--remote-debugger-port': 9000,
          //
          // this will log the console.log in the specs
          // debug: true,
          specs : [
            'test/spec/utils.js',
            'test/spec/custom_matchers.js',
            'test/spec/core-spec/*.js',
            'test/spec/plugins-spec/*.js'
          ],
          helpers : [
            'test/test-lib/jasmine-jquery.js',
            'test/test-lib/jasmine-html.js'
          ],
          vendor: [
            'libs/json2.js',
            'libs/jquery.js'
          ]
        }
      }
    }
  });



  grunt.registerTask('build', [
    'clean',
    'cssmin',
    'concat',
    'copy',
    'uglify',
    'compress',
    'test'
  ]);

  grunt.registerTask('test', [
    "jasmine:dist"
  ]);

  grunt.registerTask('default', ['build']);
};