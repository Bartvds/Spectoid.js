define(['respectoid/respectoid'], function(respectoid)
{	
	/*
	
	*/
	var expose = {};
	
	var uid = 0;
	respectoid('common.UID').constr(function()
	{
		this.uid = (++uid);
	});
	
	respectoid('common.Point').prop({x:0, y:0}).init(function(x, y){
		this.x = x || 0;
		this.y = y || 0;		
	}).member({
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
	
	respectoid('common.Display', expose).extend([
		'common.Size', 
		'common.Name'
	]).constr(function(){
		this.position = respectoid('common.Point').create();
		this.speed = respectoid('common.Point').create(300, 500);
	}).init(function(x, y){
		this.position.x = x || 0;
		this.position.y = y || 0;		
	}).member({		
		visible: true
	}).prop({
		color: 0xFF2288,
		alpha: 0
	}).bound({
		handleEvent: function(data) {
			console.log(data);
		}
	});
	
	return expose;
});