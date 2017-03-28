(function() {
    'use strict';
    dashboardApp.factory('$ajaxFactory', ['$http', '$q','appConfiguration', ajaxFactory]);

    function ajaxFactory($http, $q,appConfiguration) {

        var apiJSONFile= '/data/data.json';//'/api/Planogram/Get/';

        var methods = {
            loadJSONFile: loadJSONFile,
            loadJSONFileWithApi: loadJSONFileWithApi
        }

        return methods;

        /* method imple*/

        function loadJSONFile(filePath) {
            var deferred = $q.defer();
            $http({
                    method: 'GET',
                    url: filePath
                })
                .success(function(data, status, headers, config) {
                    deferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                    deferred.reject(data);
                });

            return deferred.promise;}

        function loadJSONFileWithApi(queryParams) {
            var deferred = $q.defer();
            $http({
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                url: apiJSONFile,
                data : JSON.stringify(queryParams)
            })
			.success(function (data, status, headers, config) {
			    deferred.resolve(data);
			})
			.error(function (data, status, headers, config) {
			    deferred.reject(data);
			});

            return deferred.promise;}
    }

})();
