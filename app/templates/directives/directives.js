dashboardApp.directive('rappid', [function() {

    var paper, graph, paperScroller, stencil, selection, selectionView, clipboard, commandManager;

    var initialization = [

        // Create a graph, paper and wrap the paper in a PaperScroller.
        function paperInit(scope, element) {

            graph = new joint.dia.Graph;

            paper = new joint.dia.Paper({
                width: 2000,
                height: 2000,
                gridSize: 10,
                perpendicularLinks: true,
                model: graph,
                markAvailable: true,
                defaultLink: new joint.dia.Link({
                    attrs: {
                        '.marker-source': { d: 'M 10 0 L 0 5 L 10 10 z', transform: 'scale(0.001)' },
                        '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' },
                        '.connection': {}
                    }
                })
            });

            paperScroller = new joint.ui.PaperScroller({
                paper: paper,
                autoResizePaper: true,
                padding: 50
            });

            $('.paper-container', element).append(paperScroller.el);

            scope.components.paper = paper;
            scope.components.scroller = paperScroller;
            scope.components.graph = graph;
        },

        // Create stencil.
        function stencilInit(scope, element) {

            function layout(graph) {
                joint.layout.GridLayout.layout(graph, {
                    columnWidth: stencil.options.width / 2 - 10,
                    columns: 2,
                    rowHeight: 75,
                    dy: 5,
                    dx: 5,
                    resizeToFit: true
                });
            }

            stencil = new joint.ui.Stencil({
                graph: graph,
                paper: paper,
                width: 240,
                groups: scope.data.stencil.groups,
                search: scope.data.stencil.search
            }).on('filter', layout);

            $('.stencil-container', element).append(stencil.render().el);

            _.each(scope.data.stencil.shapes, function(shapes, groupName) {
                stencil.load(shapes, groupName);
                layout(stencil.getGraph(groupName));
                stencil.getPaper(groupName).fitToContent(1, 1, 10);
            });

            scope.components.stencil = stencil;
        },

        // Selection
        function selectionInit(scope, element) {

            selection = new Backbone.Collection;
            selectionView = new joint.ui.Selection({
                paper: paper,
                graph: graph,
                model: selection
            });

            // Initiate selecting when the user grabs the blank area of the paper while the Shift key is pressed.
            // Otherwise, initiate paper pan.
            paper.on('blank:pointerdown', function(evt, x, y) {

                if (_.contains(KeyboardJS.activeKeys(), 'shift')) {
                    selectionView.startSelecting(evt, x, y);
                } else {
                    selectionView.cancelSelection();
                    paperScroller.startPanning(evt, x, y);
                }
            });

            paper.on('element:pointerdown', function(cellView, evt) {
                // Select an element if CTRL/Meta key is pressed while the element is clicked.
                if ((evt.ctrlKey || evt.metaKey)) {
                    selection.add(cellView.model);
                }
            });

            selectionView.on('selection-box:pointerdown', function(cellView, evt) {
                // Unselect an element if the CTRL/Meta key is pressed while a selected element is clicked.
                if (evt.ctrlKey || evt.metaKey) {
                    selection.remove(cellView.model);
                }
            });

            KeyboardJS.on('delete, backspace', _.bind(function(evt) {

                if (!$.contains(evt.target, paper.el)) {
                    // remove selected elements from the paper only if the target is the paper
                    return;
                }

                commandManager.initBatchCommand();
                selection.invoke('remove');
                commandManager.storeBatchCommand();
                selectionView.cancelSelection();

                if (_.contains(KeyboardJS.activeKeys(), 'backspace') && !$(evt.target).is("input, textarea")) {
                    // Prevent Backspace from navigating back.
                    evt.preventDefault();
                }

            }));
        },

        //  Halo, FreeTransfrom  & Inspector
        function cellToolsInit(scope, element) {

            var inspector;
            var $inspectorHolder = $('.inspector-container', element);

            function openCellTools(cellView) {
                joint.ui.Inspector.create($inspectorHolder, {
                    inputs: scope.data.inspector.inputs || {},
                    groups: scope.data.inspector.groups || {},
                    cell: cellView.model
                });

                new joint.ui.Halo({ cellView: cellView }).render();
                new joint.ui.FreeTransform({ cellView: cellView }).render();

                // adjust selection
                selectionView.cancelSelection();
                selection.reset([cellView.model]);
            }

            paper.on('element:pointerup', function(cellView) {

                if (!selection.contains(cellView.model)) {
                    openCellTools(cellView);
                }
            });
        },

        // Clipboard
        function clipboardInit(scope, element) {

            clipboard = new joint.ui.Clipboard;

            KeyboardJS.on('ctrl + c', function() {
                // Copy all selected elements and their associated links.
                clipboard.copyElements(selection, graph, {
                    translate: { dx: 20, dy: 20 },
                    useLocalStorage: true
                });
            });

            KeyboardJS.on('ctrl + v', function() {

                selectionView.cancelSelection();
                clipboard.pasteCells(graph, { link: { z: -1 }, useLocalStorage: true });

                // Make sure pasted elements get selected immediately. This makes the UX better as
                // the user can immediately manipulate the pasted elements.
                clipboard.each(function(cell) {

                    if (cell.get('type') === 'link') return;

                    // Push to the selection not to the model from the clipboard but put the model into the graph.
                    // Note that they are different models. There is no views associated with the models
                    // in clipboard.
                    selection.add(graph.getCell(cell.id));
                });
            });

            KeyboardJS.on('ctrl + x', function() {

                var originalCells = clipboard.copyElements(selection, graph, { useLocalStorage: true });
                commandManager.initBatchCommand();
                _.invoke(originalCells, 'remove');
                commandManager.storeBatchCommand();
                selectionView.cancelSelection();
            });
        },

        // Command Manager
        function commandManagerInit(scope, element) {

            commandManager = new joint.dia.CommandManager({ graph: graph });

            KeyboardJS.on('ctrl + z', function() {

                commandManager.undo();
                selectionView.cancelSelection();
            });

            KeyboardJS.on('ctrl + y', function() {

                commandManager.redo();
                selectionView.cancelSelection();
            });

            scope.components.commander = commandManager;
        },

        function toolTips(scope, element) {

            new joint.ui.Tooltip({
                rootTarget: document.body,
                target: '[data-tooltip]',
                direction: 'auto',
                padding: 10
            });
        }
    ];

    return {

        restrict: 'E',

        replace: true,

        templateUrl: './app/templates/rappid.html',

        scope: {
            source: '@'
        },

        controller: ['$scope', '$ajaxFactory', 'appConfiguration', '$rootScope', function($scope, $ajaxFactory, appConfiguration, $rootScope) {

            // container of all jointjs objects/plugins
            $scope.components = {};
            $scope.isCollapsePanel = true;
            var promiseObj = $ajaxFactory.loadJSONFile(appConfiguration.datafiles + 'basic.json');
            promiseObj.then(function(d) {
                $rootScope.showProcessing = false;
                $scope.data = _.extend({ stencil: {}, inspector: {} }, d);
            });
            promiseObj.catch(function(d) {
                $rootScope.showProcessing = false;
                $scope.data = { stencil: {}, inspector: {} };
                console.log('catch block executed : promiseObj ', d);
                return d;
            });
            promiseObj.finally(function(d) {
                // console.log('finally block executed : promiseObj', d);
            });
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
        }],

        link: function(scope, element, attrs) {

            var unbindOnData = scope.$watch('data', function(data) {
                if (!data) return;
                // run all initalizators
                _.invoke(initialization, 'call', window, scope, element);
                // remove watcher (init only once)
                unbindOnData();
            });
        }
    };
}]);
