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
	function(respectoid)
	{
		console.log('spectoid loaded');
		
		var pos = respectoid('common.Display').create();
		console.log(pos);
		
		
		$('<button class="btn">Update</button>').click(function()
		{
			console.log('run');
			world.runAll();
			
		}).appendTo('#buttonGroup');
		
	
	});
});