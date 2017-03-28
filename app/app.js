
var dashboardApp = angular.module('boardApp', ['ui.router', 'LocalStorageModule', 'ngMessages', 'ui.bootstrap']);
(function() {
    'use strict';

    dashboardApp.config(['$stateProvider', '$urlRouterProvider', '$compileProvider', '$httpProvider', 'appConfiguration', myConfigFn]);

    function myConfigFn($stateProvider, $urlRouterProvider, $compileProvider, $httpProvider, appConfiguration) {
        
        $stateProvider
            .state(appConfiguration.signInState, {
                url: appConfiguration.signIn,
                templateUrl: appConfiguration.templatePath + 'login.html',
                controller: 'mainCtrl'
            })
            .state(appConfiguration.signUpState, {
                url: appConfiguration.signUp,
                templateUrl: appConfiguration.templatePath + 'signup.html',
                controller: 'mainCtrl'
            })
            .state(appConfiguration.forgetPwdState, {
                url: appConfiguration.forgetPwd,
                templateUrl: appConfiguration.templatePath + 'forgetPassword.html',
                controller: 'mainCtrl'
            })
            .state(appConfiguration.dashboardState, {
                url: appConfiguration.dashboard,
                templateUrl: appConfiguration.templatePath + 'dashboard.html',
                controller: 'dashboardCtrl'
            });
        $urlRouterProvider.when('', appConfiguration.signUp);
        $urlRouterProvider.otherwise(appConfiguration.signUp);
    }


    dashboardApp.run(['$rootScope', myRunFn]);

    function myRunFn($rootScope) {
        $rootScope.showProcessing = false;
        $rootScope.loginId = '';
    }

})();
