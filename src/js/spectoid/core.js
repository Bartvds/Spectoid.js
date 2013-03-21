
define(['spectoid/system'], function(system){
		
	var Entity = function(id, world)
	{
		this._id = id;
		this._world = world;
		//raaaaah
		this._components = [];
	};
	Entity.prototype.addComponent = function(component)
	{
		this._world.addComponentTo(this, component);
	};
	Entity.prototype.hasComponent = function(component)
	{
		this._world.hasComponent(this, component);
	};
	Entity.prototype.destroy = function()
	{
		this._world.dropEntity(this);
	};
	Entity.prototype.componentTypeNames = function()
	{
		var arr = [];
		for (var i = 0; i < this._components.length;i++)
		{
			arr.push(this._components[i] ? this._components[i].type : null);
		}
		return arr;
	};
	//bah
	var Component = function(type)
	{
		//ridiculous
		if (!type) throw new Error('subclass needs a type');
		this.type = type;
		this.id = -1;
	};
		
	return {
		Entity:Entity,
		protoComponent: function(type, constr, requires, provide)
		{	
			//console.log(['protoComponent',type, constr, requires, provide]);
			//swap			
			constr.type = type;
			constr.requires = requires;
			constr.provide = provide;
			constr.prototype = new Component(type);
			constr.prototype.type = type;
			constr.prototype.constructor = constr;
			constr.toString = function()
			{
				return type + (requires ? '(' + requires + ')' : '');
			};
			return constr;
		},
		protoSystem: function(type, constr)
		{
			constr.type = type;
			constr.prototype = new system.System();
			constr.prototype.type = type;
			constr.prototype.constructor = constr;
			constr.toString = function()
			{
				return type;
			};
			return constr;
		},
	
		//experimental
		protoObject: function(parent, constr)
		{
			var t = function()
			{
				if (parent) parent.apply(this, arguments);
				constr.apply(this, arguments);
			};
			t.prototype = new parent();
			t.prototype.super = constr.prototype;
			t.prototype.constructor = t;
			return t;
		},
	};
});