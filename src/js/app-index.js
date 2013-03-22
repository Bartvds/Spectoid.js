requirejs.config({
    /*shim: {
     'lib/lodash': {
     exports: '_'
     }
     }*/
});
require(['lib/easel', 'lib/preload', 'lib/stats', 'lib/domReady!'], function (easel) {

    require(['spectoid/spectoid', 'spectoid/common', 'spectoid/easel', 'spectoid/geom', 'lib/text!../data/config.json'],
        function (spectoid, common, easelMod, geom, config) {
            console.log('spectoid loaded');
            var world = new spectoid.World();
            var stage = new createjs.Stage('stage-canvas');

            console.log([stage.canvas.width, stage.canvas.height])

            console.log('config loaded');
            config = JSON.parse(config);
            world.useConfig(config);

            var speed = world.addSystem(new common.SpeedSystem());
            var wrap = world.addSystem(new common.WrapStageSystem(new geom.Rectangle(0, 0, stage.canvas.width, stage.canvas.height)));
            var easel = world.addSystem(new easelMod.EaselSystem(stage));
            var mouse = world.addSystem(new easelMod.MouseInteractionSystem(stage));
            var tracker = world.addSystem(new easelMod.LabelTrackerSystem());

            var handleTick = function (event) {
                //speed.delta = 1 / createjs.Ticker.getMeasuredFPS();
                speed.delta = 1 / createjs.Ticker.getFPS();
                speed.run();
                wrap.run();
                easel.run();
                mouse.updateMembers();
            }
            createjs.Ticker.setFPS(24);
            createjs.Ticker.addEventListener("tick", handleTick);

            var ll = 0;
            $('<button class="btn">Render</button>').click(function () {
                stage.update();
            }).appendTo('#buttonGroup');

            $('<button class="btn">Add Entity</button>').click(function () {
                console.log('add');
                var entity = world.createEntity();

                entity.addComponent(new common.PositionComponent(Math.random() * stage.canvas.width, Math.random() * stage.canvas.height));
                entity.addComponent(new common.ColorComponent(Math.random() * 255, Math.random() * 255, Math.random() * 255));
                entity.addComponent(new common.SizeComponent(Math.random() * 100 + 10));
                entity.addComponent(new common.DisplayComponent());
                entity.addComponent(new common.SpeedComponent(Math.random() * 100 - 50, Math.random() * 100 - 50));
                entity.addComponent(new easelMod.MouseTargetComponent(true, true));

                if (ll % 2 == 0) {
                    entity.addComponent(new common.LabelComponent('Labeled ' + ll));
                }

                console.log(world.countEntities());

                ll++;
            }).appendTo('#buttonGroup');

            $('<button class="btn">Update</button>').click(function () {
                console.log('run');
                world.runAll();

            }).appendTo('#buttonGroup');

            $('<button class="btn">Update Forced</button>').click(function () {
                console.log('run');
                world.runAll(true);

            }).appendTo('#buttonGroup');
            $('<button class="btn">Run Tracker</button>').click(function () {
                console.log('tracker');
                tracker.run();
            }).appendTo('#buttonGroup');

            $('<button class="btn">Delete Entity</button>').click(function () {
                console.log('del');
                if (world.countEntities() > 0) {
                    world.dropEntity(world.getEntityAt(Math.floor(world.countEntities() * Math.random())));
                }
                console.log(world.countEntities());
            }).appendTo('#buttonGroup');

            $('<button class="btn">Add Position</button>').click(function () {
                console.log('add p');

                var arr = world.getEntities()
                for (var i = arr.length - 1; i >= 0; i--) {
                    if (!arr[i].hasComponent(common.PositionComponent)) {
                        arr[i].addComponent(new common.PositionComponent(8, 8));
                        console.log('add p on ' + arr[i]);
                        break;
                    }
                }
            }).appendTo('#buttonGroup');


        });
});