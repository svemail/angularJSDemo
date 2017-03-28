(function() {
    'use strict';

    dashboardApp.controller("dashboardCtrl", ['$scope', '$rootScope', 'appConfiguration', '$state', '$ajaxFactory', 'localStorageService', dashboardCtrl]);

    function dashboardCtrl($scope, $rootScope, appConfiguration, $state, $ajaxFactory, localStorageService) {
        $rootScope.loginId = localStorageService.get('email');
        $scope.isCollapsePanel = true;
        $scope.isShowMenu = true;
        $scope.dataSource = {};
        var index = 1;
        // if (!$rootScope.loginId) {
        //     $state.go(appConfiguration.signInState);
        // }

        $scope.createProject = function() {
            alert('bootstrap dialog required');
        }
        $scope.showMenu = function() {
            $scope.isShowMenu = !$scope.isShowMenu;
        }
        $scope.removePanel = function(event) {
            event.preventDefault();
            $scope.isCollapsePanel = false;
            $('.drawingArea-data').css("border-bottom", "solid #3a3d47");
        }
        $scope.showHidePanel = function() {
            event.preventDefault();
            var hpanel = $(event.target).closest('div.cpanel');
            var icon = $(event.target).closest('i');
            var body = hpanel.find('div.cpanel-body');
            var footer = hpanel.find('div.cpanel-footer');
            body.slideToggle(300);
            footer.slideToggle(200);

            // Toggle icon from up to down
            icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
            hpanel.toggleClass('').toggleClass('cpanel-collapse');
            setTimeout(function() {
                hpanel.resize();
            }, 50);

            $('.drawingArea-data').css("height", "100%");
        }

        $scope.loadData = function(filepath) {
            var promiseObj = $ajaxFactory.loadJSONFile(appConfiguration.datafiles + filepath);
            promiseObj.then(function(d) {
                $rootScope.showProcessing = false;
                $scope.isErorMsg = true;
                $scope.dataSource['file'+index] = d;
                index ++;
                console.log($scope.dataSource)
            });
            promiseObj.catch(function(d) {
                $rootScope.showProcessing = false;
                console.log('catch block executed : promiseObj ', d);
                return d;
            });
            promiseObj.finally(function(d) {
                //console.log('finally block executed : promiseObj', d);
            });
        }

        $scope.loadData('file1.json');
        $scope.loadData('file2.json');
    }

})();
