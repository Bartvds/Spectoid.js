requirejs.config({
	/*shim: {
		'lib/lodash': {
			exports: '_'
		}
	}*/
});
require(['lib/easel', 'lib/preload', 'lib/stats', 'lib/domReady!'], function(easel)
{
	
	require(['respectoid/respectoid', 'respectoid/common', 'lib/text!../data/config.json'], 
	function(respectoid, common)
	{
		console.log('spectoid loaded');
		
		//respectoid.compile();
		
		var pos = common.Display.create(5, 10);
		console.log(pos);
		
		
		$('<button class="btn">Update</button>').click(function()
		{
			console.log('run');
			world.runAll();
			
		}).appendTo('#buttonGroup');
		
	
	});
});