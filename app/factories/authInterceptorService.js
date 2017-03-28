(function() {
    'use strict';
    dashboardApp.factory('authInterceptorService', ['$q', '$location', 'appConfiguration', 'localStorageService',
        function($q, $location, appConfiguration, localStorageService) {

            var authInterceptorServiceFactory = {};

            var _request = function(config) {

                config.headers = config.headers || {};

                var authData = localStorageService.get('email');
                if (authData) {
                    config.headers.Authorization = 'Bearer ' + authData;
                }

                return config;
            }

            var _responseError = function(rejection) {
                if (rejection.status === 401) {
                    var authData = localStorageService.get('email');
                    try {
                        $location.url(appConfiguration.login);
                    } catch (e) {}
                }
                return $q.reject(rejection);
            }

            authInterceptorServiceFactory.request = _request;
            authInterceptorServiceFactory.responseError = _responseError;

            return authInterceptorServiceFactory;
        }
    ]);
})();
