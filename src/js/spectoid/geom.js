
define(function(){
	
	var Point = function(x, y)
	{
		this.x = x || 0;
		this.y = y || 0;		
	}
	var Rectangle = function(x, y, width, height)
	{
		this.x = x || 0;
		this.y = y || 0;
		//raaaaah
		this.width = width || 0;
		this.height = height || 0;
	};
	Rectangle.prototype.right = function()
	{
		return this.x + this.width;
	};
	Rectangle.prototype.bottom = function()
	{
		return this.y + this.height;
	};
	
	Rectangle.prototype.pad = function(x, y)
	{
		if (typeof y == 'undefined') y = x;
		this.x -= x;
		this.y -= y;
		this.width += x * 2;
		this.height += y * 2;
	};
	//bah
		
	return {
		Point:Point,
		Rectangle:Rectangle
	};
});