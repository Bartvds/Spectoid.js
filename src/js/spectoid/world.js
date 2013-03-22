define(['spectoid/core'], function(core){
	
	var World = function()
	{
		this._entities = [];
		this._entityNextId = 0;
		this._componentTypes = [];
		this._componentMap = {};
		this._componentsNextId = 0;
		this._systems = [];
		
		this.name = '';
	};
	World.prototype.useConfig = function(config)
	{
		this.name = config.name || this.name;
	};
	World.prototype.mapComponent = function(constr)
	{
		this._componentMap[constr.type] = constr;
	};
	World.prototype.createEntity = function()
	{
		var id = 'ex' + this._entityNextId;
		this._entityNextId++;
		var e = new core.Entity(id, this);
		this._entities.push(e);
		return e;
	};
	World.prototype.dropEntity = function(e)
	{
		var i = this._entities.indexOf(e);
		if (i > -1)
		{
			this._entities.splice(i, 1);
			//notify
			var l = this._systems.length;
			for (i = 0; i < l;i++)
			{
				this._systems[i]._dropped(e);
			}
		}
	};
	World.prototype.countEntities = function()
	{
		return this._entities.length;
	};
	World.prototype.countCompTypes = function()
	{
		return this._componentTypes.length;
	};
	World.prototype.getEntities = function()
	{
		return this._entities.concat();
	};
	World.prototype.getEntityAt = function(index)
	{
		if (index >= 0 && index < this._entities.length)
		{
			return this._entities[index];
		}
		return null;
	};
	World.prototype.addComponentTo = function(e, component)
	{
		console.log(['addComponentTo', e, component.type]);
		var i, ii;
		i = this._componentTypes.indexOf(component.type);
		if (i < 0)
		{
			i = this._componentTypes.push(component.type) - 1;
			this._componentMap[component.type] = component.constructor;
			//console.log(['new type', i, component.type]);
		}
		//no gaps (better use a single splice?)
		while (e._components.length < this._componentTypes.length)
		{
			e._components.push(null);
		}
		component.id = i;
		e._components[i] = component;
		//console.log(['comp', i, e._components.length]);
		//console.log(['comp', e.componentTypeNames()]);
		
		//check if we have required components
		if (component.constructor.requires)
		{
			var deps = component.constructor.provide ? [] : false;
			ii = component.constructor.requires.length;
			for (i = 0; i < ii;i++)
			{
				var req = component.constructor.requires[i];
				console.log(req.type);
				var ind = this.getComponentIndex(req);
				console.log(ind);
				if (ind > -1 && ind < e._components.length)
				{
					if (e._components[ind])
					{
						if (deps)
						{
							deps.push(e._components[ind]);
						}
					}
					else
					{
						throw new Error(component.type + ' missing required component '+req.type);
					}
				}
				else
				{
					throw new Error(component.type + ' unknown required component '+req.type);
				}
			}
			if (deps)
			{
				component.constructor.provide.apply(component, deps);
			}
		}
		
		//notify
		ii = this._systems.length;
		for (i = 0; i < ii;i++)
		{
			this._systems[i]._compChanged(e, component.constructor);
		}
	};
	World.prototype.hasComponent = function(e, component)
	{		
		var i = this._componentTypes.indexOf(component.type);
		return i > -1 && i < e._components.length && e._components[i];
	};
	
	World.prototype.getComponentIndex = function(type)
	{
		//console.log(['getComponentIndex', type.type, '->', this.componentTypeNames()]);
		if (!type) throw new Error('null type');
		if (!type.type) throw new Error('null type.type');
		return this._componentTypes.indexOf(type.type);
	};	
	World.prototype.componentTypeNames = function()
	{
		var arr = [];
		var ii = this._componentTypes.length;
		for (var i = 0; i < ii;i++)
		{
			arr.push(this._componentTypes[i]);
		}
		return arr;
	};
	
	World.prototype.addSystem = function(system)
	{
		if(this._systems.indexOf(system) < 0)
		{
			console.log(['World.addSystem',system]);
			this._systems.push(system);
			system._init(this);
		}
		return system;
	};
	
	World.prototype.runAll = function(force)
	{
		var arr = [];
		var ii = this._systems.length;
		for (var i = 0; i < ii;i++)
		{
			if (force)
			{
				this._systems[i].update();
			}
			this._systems[i].run();
		}
		return arr;
	};
	
	return {
		World:World
	};
});
