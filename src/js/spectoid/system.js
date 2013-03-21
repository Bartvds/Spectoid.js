define(['spectoid/aspect'], function(aspect){
	
	var System = function System()
	{
		this.aspect = new aspect.Aspect();
		this._world = null;
	};	
	System.prototype.type = 'System';
	System.prototype.toString = function()
	{
		return this.type;
	};	
	System.prototype._init = function(world)
	{
		this._world = world;
		this.aspect._world = world;
		this._members = [];
		this._modified = [];
		var l = this._lookups.length;
		for (var i = 0; i < l;i++)
		{
			this._lookups[i]._init(this._world);
		}
		this._lookups = null;
		this.init();
		this._scanAll = true;
	};
	System.prototype._compChanged = function(e, comp)
	{
		//????????????
		var i;
		//delay adding
		if (this.aspect.uses(comp))
		{
			i = this._modified.indexOf(e);
			if (i < 0)
			{
				console.log([this.type + '.compChanged(e) reconsider', e, comp]);
				this._modified.push(e);
				this._isModified = true;
			}
		}
	};
	System.prototype._dropped = function(e)
	{
		console.log([this.type + '.removed(e)', e]);
		var i
		
		i = this._modified.indexOf(e);
		if (i > -1)
		{
			this._modified.splice(i, 1);
			this._isModified = this._modified.length > 0;
			console.log([this.type + '.removed(e) from modified', e]);
		}
			
			
		i = this._members.indexOf(e);
		if (i > -1)
		{
			this._members.splice(i, 1);
			console.log([this.type + '.removed(e) from cache', e]);
			
			this.removed(e);
		}
	};
	System.prototype.updateMembers = function()
	{
		var i;
		var e;
		if(this._scanAll)
		{
			this._modified = this._world.getEntities();
			this._isModified = true;
			this._scanAll = false;
		}
		
		if (this._isModified)
		{
			while(this._modified.length > 0)
			{
				e = this._modified.pop();
				i = this._members.indexOf(e);
					
				if (this.aspect.acceptEntity(e))
				{
					if (i < 0)
					{
						this._members.push(e);
						this.added(e);
					}
				}
				else if (i > -1)
				{
					this._members.splice(i, 1);
					this.removed(e);
				}
			}
			this._isModified = false;
		}
	};
	System.prototype.run = function()
	{
		this.updateMembers();
		this.begin();
		//unsafe for removals?		
		var i;	
		var ii = this._members.length;
		for (i = 0; i < ii;i++)
		{
			this.process(this._members[i])
		}
		this.end();
	};
	System.prototype.getLookup = function(type)
	{
		var lookup = new Lookup(type);
		if (this._world)
		{
			lookup._init(this._world);
		}
		else
		{
			if (!this._lookups) this._lookups = [];
			this._lookups.push(lookup);
		}
		return lookup;
	};
	//shorthand
	System.prototype.haveLookup = function(type)
	{
		this.aspect.have(type);
		return this.getLookup(type);
	};
	System.prototype.update = function()
	{
		this._scanAll = true;
	};
	
	System.prototype.init = function()
	{
		//console.log(['override ' + this.type + '.init()']);
	};
	System.prototype.added = function(e)
	{
		//console.log(['override ' + this.type + '.added(e)', e]);
	};
	System.prototype.removed = function(e)
	{
		//console.log(['override ' + this.type + '.removed(e)', e]);
	};
	
	System.prototype.begin = function()
	{
		//console.log(['override ' + this.type + '.begin()']);
	};
	System.prototype.process = function(e)
	{
		//console.log(['override ' + this.type + '.process(e)', e]);
	};
	System.prototype.end = function()
	{
		//console.log(['override ' + this.type + '.end()']);
	};
	
	var Lookup = function Lookup(type)
	{
		this._type = type;
		this._index = -1;
	};	
	Lookup.prototype._init = function(world)
	{
		//console.log(['Lookup.init', this._type]);
		this._world = world;
	};
	Lookup.prototype.get = function(e)
	{
		//lazy init
		if (this._index < 0 && this._world)
		{
			this._index = this._world.getComponentIndex(this._type);
		}
		if (this._index < 0)
		{
			return null;
		}
		//self optimize
		this.get = this.getFast;
		return this.get(e);
	};
	Lookup.prototype.getFast = function(e)
	{
		return e._components[this._index];
	};
	return {
		System:System
	};
});