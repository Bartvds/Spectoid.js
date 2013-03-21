define(['spectoid/core', 'spectoid/world', 'spectoid/system', 'spectoid/aspect'], 
	function (core, world, system, aspect)
	{	
		return {
			protoComponent: core.protoComponent,
			protoSystem: core.protoSystem,
			protoObject: core.protoObject,
			World: world.World,
			System: system.System
		};
	});