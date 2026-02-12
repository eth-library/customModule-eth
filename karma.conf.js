// Karma configuration for Angular 18
// Produces HTML test report and coverage report

module.exports = function (config) {
  config.set({
    basePath: '',

    frameworks: ['jasmine', '@angular-devkit/build-angular'],

    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('karma-html-reporter'),          
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    client: {
      jasmine: {
        random: false
      }
    },

    reporters: ['progress', 'html'],           

    htmlReporter: {
      outputDir: 'test-results',               
      reportName: 'test-report',               
      focusOnFailures: true,
      namedFiles: false,
      preserveDescribeNesting: true,
      foldAll: false
    },

    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/custom-module'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ]
    },

    browsers: ['ChromeHeadless'],         
    restartOnFileChange: true,
    colors: true
  });
};
