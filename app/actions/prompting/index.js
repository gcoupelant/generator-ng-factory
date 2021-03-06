'use strict';

var path = require('path');
var yosay = require('yosay');
var chalk = require('chalk');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

module.exports = function () {
  var self = this, done = this.async();
  var props = this.props, argv = this.argv;

  // var promise = debug ? Promise.resolve(JSON.parse('{"git":{"name":"Olivier Louvignes","email":"olivier@mg-crea.com"},"type":"application","name":"test","ngVersion":"~1.3.0","ngModules":["animate","route"],"components":["twbs/bootstrap"],"htmlPreprocessor":"jade","jsPreprocessor":"none","cssPreprocessor":"less","supportLegacy":"no","license":"MIT","user":"mgcrea"}')).then(function(_props) { _.extend(props, _props); }) :

  // Have Yeoman greet the user
  self.log(yosay(chalk.yellow.bold('Welcome to ngFactory, ladies and gentlemen!')));
  clearInterval(this.spinner);

  return fs.readFileAsync(path.resolve(process.env.PWD, 'ngfactory.json'))
  .then(function(buffer) {
    self.log(chalk.cyan('info') + ' Loading ngfactory.json from cwd');
    var localConfig = JSON.parse(buffer.toString());
    _.extend(props, localConfig);
  })
  .catch(function(err) {})
  .then(function() {

    // Fetch git config settings
    // var email = require('git-user-email');
    props.git = {
      name: self.user.git.name(),
      email: self.user.git.email()
    };

    // Handle command-line args
    var basename = path.basename(process.env.PWD);
    if(argv.app || argv.application) {
      props.type = 'application';
    }
    if(argv.cmp || argv.component) {
      props.type = 'component';
    }
    if(argv.y || argv.yes) {
      _.defaults(props, {
        name: basename,
        htmlPreprocessor: 'jade',
        jsPreprocessor: 'none',
        cssPreprocessor: 'less',
        license: 'MIT'
      });
    }

    return self.promptAsync([{
      name: 'type',
      when: self.whenUndefinedProp('type'),
      message: 'What are you building today?',
      type: 'list',
      choices: ['application', 'component', 'library'],
      default: 0
    }]).then(function() {
      return self.promptAsync([{
        name: 'name',
        when: self.whenUndefinedProp('name'),
        message: 'What\'s the package name of your ' + props.type + '?',
        default: basename
      }]);
    });

  })
  .then(function fetchGithubInfo() {

    if(argv.username) return argv.username;
    if(props.git.email) return require('./../../modules/github').email(props.git.email);

  })
  .then(function askForExtraInformation(username) {

    if(argv.y || argv.yes) {
      props.username = username;
    }

    return self.promptAsync([{
      name: 'username',
      when: self.whenUndefinedProp('username'),
      message: 'Would you mind telling me your username on GitHub?',
      default: username
    }]);

  })
  .then(function() {

    return require('./' + props.type).call(self);

  })
  .then(function askForBuildSettings() {

    return self.promptAsync([{
      name: 'htmlPreprocessor',
      when: self.whenUndefinedProp('htmlPreprocessor'),
      message: 'Should I set up one of those HTML preprocessors for you?',
      type: 'list',
      choices: ['none', 'jade'],
      default: 0
    },
    {
      name: 'jsPreprocessor',
      when: self.whenUndefinedProp('jsPreprocessor'),
      message: 'Should I set up one of those JS preprocessors for you?',
      type: 'list',
      choices: ['none', '6to5', 'coffee'],
      default: 0
    },
    {
      name: 'cssPreprocessor',
      when: self.whenUndefinedProp('cssPreprocessor'),
      message: 'Should I set up one of those CSS preprocessors for you?',
      type: 'list',
      choices: ['none', 'less', 'sass'],
      default: 1
    },
    {
      name: 'license',
      when: self.whenUndefinedProp('license'),
      message: 'Under which license your project shall be released?',
      default: 'MIT'
    }]);

  })
  .then(function prepareViewProps() {

    props.version = '0.1.0';
    props.pkgName = _.dasherize(props.name).replace(/^-/, '');
    props.className = _.classify(props.name);
    props.moduleName = (props.username ? props.username + '.' : '') + props.className;
    if(!props.locale) {
      props.locale = 'en';
    }

  })
  .then(function() {

    done(null);

  });

};
