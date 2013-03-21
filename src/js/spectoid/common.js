define(['spectoid/spectoid'], function(spectoid){
	
	var PositionComponent = spectoid.protoComponent('PositionComponent', function PositionComponent(x, y)
	{
		this.x = x || 0;
		this.y = y || 0;
	});	
	
	var DisplayComponent = spectoid.protoComponent('DisplayComponent', function DisplayComponent()
	{
		this.display = null;
	},
	[PositionComponent], function(position)
	{
		this.position = position;
	});
	
	var SpeedComponent = spectoid.protoComponent('SpeedComponent', function SpeedComponent(x, y)
	{
		this.x = x || 0;
		this.y = y || 0;
	},
	[PositionComponent], function(position)
	{
		this.position = position;
	});
	
	var ColorComponent = spectoid.protoComponent('ColorComponent', function ColorComponent(r, g, b)
	{
		this.r = typeof r == 'undefined' ? 255 : r;
		this.g = typeof g == 'undefined' ? 0 : g;
		this.b = typeof b == 'undefined' ? 0 : b;
	});
	ColorComponent.prototype.hex = function()
	{
		return this.b | (this.g << 8) | (this.r << 16);
	};
	ColorComponent.prototype.toHex = function()
	{
		return (this.b | (this.g << 8) | (this.r << 16)).toString(16);
	};
	
	var SizeComponent = spectoid.protoComponent('SizeComponent', function SizeComponent(size)
	{
		this.size = typeof size == 'undefined' ? 0 : size;
	});
	
	var LabelComponent = spectoid.protoComponent('LabelComponent', function LabelComponent(label, text)
	{
		this.label = label || '';
		this.text = text || '';
	});
	LabelComponent.prototype.getString = function(seperator)
	{
		this.seperator = typeof seperator == 'undefined' ? ': ' : seperator;
		return this.label + (this.text ? seperator + this.text : '');
	};
	
	var SpeedSystem = spectoid.protoSystem('SpeedSystem', function()
	{
		spectoid.System.call(this);
		
		this.speed = this.haveLookup(SpeedComponent);
		
		this.delta = 1;
	});	
	SpeedSystem.prototype.process = function(e)
	{
		var speed = this.speed.get(e);
		speed.position.x += speed.x * this.delta;
		speed.position.y += speed.y * this.delta;
	};
	
	var WrapStageSystem = spectoid.protoSystem('WrapStageSystem', function(bounds)
	{
		spectoid.System.call(this);
		
		this.position = this.haveLookup(PositionComponent);		
		this.bounds = bounds;
	});	
	
	WrapStageSystem.prototype.process = function(e)
	{
		var position = this.position.get(e);
		if (position.x < this.bounds.x)
		{
			position.x = this.bounds.x  + this.bounds.width;
		}
		else if (position.x > this.bounds.x  + this.bounds.width)
		{
			position.x = this.bounds.x
		}
		if (position.y < this.bounds.y)
		{
			position.y = this.bounds.y  + this.bounds.height;
		}
		else if (position.y > this.bounds.y + this.bounds.height)
		{
			position.y = this.bounds.y
		}
	};
	
	return {
		PositionComponent:PositionComponent,
		LabelComponent:LabelComponent,
		SizeComponent:SizeComponent,
		ColorComponent:ColorComponent,
		DisplayComponent:DisplayComponent,
		SpeedComponent:SpeedComponent,
		WrapStageSystem:WrapStageSystem,
		SpeedSystem:SpeedSystem
	};
});