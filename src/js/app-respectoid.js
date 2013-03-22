requirejs.config({
	/*shim: {
		'lib/lodash': {
			exports: '_'
		}
	}*/
});
require(['lib/easel', 'lib/preload', 'lib/stats', 'lib/domReady!'], function(easel)
{
	require(['respectoid/protoid', 'respectoid/common', 'lib/text!../data/config.json'],
	function(respectoid, common)
	{
		console.log('spectoid loaded');
		
		//protoid.compile();

        //protoid('common.Display').create();
		var pos = common.Display.create(5, 10);
		var pos2 = common.Display.create(500, 1000);
		console.log(pos2);
		pos2.parent = 5555;
		console.log(pos2.parent);
		pos2.parent = 6666;
		console.log(pos2.parent);

		$('<button class="btn">Update</button>').click(function()
		{
			console.log('run');
			world.runAll();
			
		}).appendTo('#buttonGroup');
		
	
	});
});