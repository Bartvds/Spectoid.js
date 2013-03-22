define(['respectoid/respectoid'], function(respectoid)
{	
	/*
	
	*/
	var uid = 0;
	respectoid('common.UID').constr(function()
	{
		this.uid = (++uid);
	});
	respectoid('common.Point').prop({x:0, y:0}).member({
		reset: function()
		{
			this.x = 0;
			this.y = 0;
		}
	});
	respectoid('common.Name').extend('common.UID').constr(function()
	{
		this.name = '';
	});
	respectoid('common.Size').constr(function()
	{
		this.size = 10;
		
	}).member({
		scale: function(scale)
		{
			this.size *= scale;
		}
	});
	
	respectoid('common.Display').extend('common.Size', 'common.Name').constr(function()
	{
		this.position = respectoid.create('common.Point');
		this.speed = respectoid.create('common.Point', {x:22, y:33});
		
	}).prop({
		color: 0xFF2288,
		visible: true
	}).bound({
		handleEvent: function(data)
		{
			console.log(data);
		}
	});
	
	return null;
});