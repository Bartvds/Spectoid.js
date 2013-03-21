define(['spectoid/spectoid', 'spectoid/common', 'lib/easel'], function(spectoid, common){
	
	var EaselSystem = spectoid.protoSystem('EaselSystem', function (stage)
	{		
		spectoid.System.call(this);
		this.stage = stage;
		
		this.position = this.haveLookup(common.PositionComponent);
		this.color = this.haveLookup(common.ColorComponent);
		this.display = this.haveLookup(common.DisplayComponent);
		
		this.size = this.getLookup(common.SizeComponent);
	});
	EaselSystem.prototype.init = function()
	{
		
	};
	EaselSystem.prototype.added = function(e)
	{	
		console.log(['added', e, this.color.get(e).toHex()]);
		var comp = this.display.get(e);
		if (!comp.display)
		{		
			comp.display = new createjs.Shape();			
			var size = this.size.get(e);			
			comp.display.graphics.beginFill('#'+this.color.get(e).toHex()).drawCircle(0, 0, (size ? size.size : 40));
			comp.display.graphics.beginFill('#ffffff').drawCircle(0, 0, 5, 5);
		}
		this.stage.addChild(comp.display);
	};
	EaselSystem.prototype.removed = function(e)
	{
		console.log(['removed', e]);
		var comp = this.display.get(e);
		if (comp.display && comp.display.parent)
		{
			comp.display.parent.removeChild(comp.display);
		}	
		comp.position = null;
		comp.display = null;
	};
	EaselSystem.prototype.process = function(e)
	{
		var comp = this.display.get(e);
		//comp.display.x = comp.position.x;
		//comp.display.y = comp.position.y;
		
		var position = this.position.get(e);
		comp.display.x = position.x;
		comp.display.y = position.y;
	};
	EaselSystem.prototype.end = function(e)
	{
		this.stage.update();
	};
	
	
	var MouseInteractionSystem = spectoid.protoSystem('MouseInteractionSystem', function (stage)
	{
		spectoid.System.call(this);		
		this.stage = stage;
		
		this.display = this.haveLookup(common.DisplayComponent);
		this.mouse = this.haveLookup(MouseTargetComponent);
		
		createjs.Touch.enable(this.stage);

		// enabled mouse over / out events
		this.stage.enableMouseOver(10);
		this.stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas
		
		this.selected = null;
	});
	MouseInteractionSystem.prototype.added = function(e)
	{
		var display = this.display.get(e).display;
		if(display)
		{		
			var that = this;
			var mouse = this.mouse.get(e);
			mouse.mousedown = function(evt)
			{
				console.log('mousedown '+e._id);
				display.parent.addChild(display);
				if (that.selected)
				{
					that.mouse.get(that.selected).selected = false;
				}
				if (mouse.selectable)
				{
					mouse.selected = true;
					that.selected = e;
				}
				mouse.mouseIsDown = true;
			};
			mouse.stagemouseup = function(evt)
			{
				if (mouse.mouseIsDown)
				{				
					console.log('stagemouseup '+e._id);	
					mouse.mouseIsDown = false;	
				}
			};
			mouse.mouseover = function()
			{
				console.log('mouseover '+e._id);
				mouse.mouseIsOver = true;
			};
			mouse.mouseout = function()
			{
				console.log('mouseout '+e._id);
				mouse.mouseIsOver = false;
			};
			
			display.addEventListener('mousedown', mouse.mousedown);
			this.stage.addEventListener('stagemouseup', mouse.stagemouseup);			
			display.addEventListener('mouseover', mouse.mouseover);
			display.addEventListener('mouseout', mouse.mouseout);
		}
	};
	MouseInteractionSystem.prototype.removed = function(e)
	{
		if (e == this.selected)
		{
			this.selected = null;
		}
		var mouse = this.mouse.get(e);
		mouse.mouseIsOver = false;
		mouse.mouseIsDown = false;
		
		var display = this.display.get(e).display;
		if(display)
		{
			display.removeEventListener('mousedown', mouse.mousedown);
			display.removeEventListener('stagemouseup', mouse.stagemouseup);
			display.removeEventListener('mouseover', mouse.mouseover);
			display.removeEventListener('mouseout', mouse.mouseout);
		}
	};
	
	var MouseTargetComponent = spectoid.protoComponent('MouseTargetComponent', function MouseTargetComponent(enabled, selectable)
	{
		this.enabled = typeof enabled == 'undefined' ? true : enabled;
		this.selectable = typeof selectable == 'undefined' ? false : selectable;
		this.mouseIsOver = false;
		this.mouseIsDown = false;
		this.selected = false;
	},
	[common.DisplayComponent], function(display)
	{
		//console.log('link display ' + display);
		this.display = display;
		this.display.mouseEnabled = this.enabled;
	});
	MouseTargetComponent.prototype.enabled = function(enabled)
	{
		if (typeof enabled != 'undefined')
		{
			this.enabled = !!enabled;
			if (this.display) this.display.mouseEnabled = this.enabled;
		}
		return this.enabled;
	};
	
	var LabelTrackerSystem = spectoid.protoSystem('LabelTrackerSystem', function()
	{
		spectoid.System.call(this);
		
		this.label = this.haveLookup(common.LabelComponent);
		this.position = this.haveLookup(common.PositionComponent);
	});
	LabelTrackerSystem.prototype.process = function(e)
	{
		var position = this.position.get(e);
		console.log(position.x + ',' + position.y + ' - ' +this.label.get(e).getString());
	};
	
	return {
		EaselSystem:EaselSystem,
		MouseInteractionSystem:MouseInteractionSystem,
		MouseTargetComponent:MouseTargetComponent,
		LabelTrackerSystem:LabelTrackerSystem
	};
});