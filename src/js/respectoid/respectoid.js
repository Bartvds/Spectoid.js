define(function()
{
	var types = {};
	var expose;
	
	//make main value
	var type = expose = function(type, expose)
	{
		if (type in types)
		{
			return types[type];
		}
		var def = new DefType(type);		
		types[type] = def;
		
		if (expose)
		{
			var short = type.match(/[\w-]+$/);
			short = short.length > 0 ? short[short.length-1] : type
			expose[short] = def;
		}
		return def;
	};
	var compile = expose.compile = function()
	{
		for (var type in types)
		{
			var def = types[type];
			if(!def.compiled) def.compile();
			if(!def.compiled) throw new Error('error compiling type ' + type);
		}
	};
	
	var Def = function(type)
	{
		this.type = type;
		this.constr = null;
		this.props = null;
		this.extend = null;
		this.members = null;
		this.bind = null;
		
		this.chain = null;
		this.proto = null;
	};
	
	var DefType = function(type)
	{
		console.log(['DefType', type]);
		this.type = type;
		this.def = new Def(type);
		this.compiled = false;
	};
	
	DefType.prototype.extend = function(args)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.extend) this.def.extend = [];
		for (var i = 0, ii = arguments.length; i < ii; i++)
		{
			var extend = arguments[i];
			if (typeof extend == 'string')
			{
				this.def.extend.push(arguments[i]);
			}
			else
			{
				for (var j = 0, jj = extend.length; j < jj; j++)
				{
					this.def.extend.push(extend[j]);
				}
			}
		}
		return this;
	};
	DefType.prototype.constr = function(constr)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.constr = constr;
		return this;
	};
	DefType.prototype.init = function(init)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.init = init;
		return this;
	};
	DefType.prototype.prop = function(props)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.props) this.def.props = {};
		for (var name in props)
		{
			this.def.props[name] = props[name];
		}
		return this;
	};
	DefType.prototype.member = function(members)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.members) this.def.members = {};
		for (var name in members)
		{
			this.def.members[name] = members[name];
		}
		return this;
	};
	DefType.prototype.bound = function(methods)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		if (!this.def.bind) this.def.bind = {};
		for (var name in methods)
		{
			this.def.bind[name] = methods[name];
		}
		return this;
	};
	DefType.prototype.create = function()
	{
		if (this.compiled || this.compile())
		{
			return new this.def.proto(arguments);
		}
		return null;
	};
	DefType.prototype.compile = function()
	{
		if (this.compiled) throw new Error('type compiled, cannot recompile ' + this.type);
		console.log(['Def.compile', this.def.type, this]);
		this.compiled = false;
		this.def.proto = null;
		this.def.chain = appendChain(this.def, [this.def]);
		var name;
		var def = this.def;
		var constructors = [];
		var props = [];
		var bind = {};
		var that = this;
		def.proto = function(args)
		{
			var i, name;
			for (name in props)
			{
				this[name] = props[name];
			}
			/*if (params)
			{
				for (name in params)
				{
					this[name] = params[name];
				}
			}*/
			for (i = 0; i < constructors.length; i++)
			{
				constructors[i].call(this);
			}
			for (name in bind)
			{
				this[name] = bindTo(this[name], this);
			}
			if (def.init) def.init.apply(this, args);
		};
		
		addDef(def, def, props, bind);
		
		def.chain.forEach(function(sup, i)
		{
			if (sup.constr)
			{
				constructors.push(sup.constr);
			}
			addDef(def, sup, props, bind);
		});
		this.compiled = true;
		console.log(['Def.compile done', this.def.type, this]);
		return this.compiled;
	};	
	var bindTo = function(func, scope)
	{
		return function()
		{
			return func.apply(scope, arguments);
		};
	};
	var addDef = function(to, def, props, bind)
	{
		var i, name;
		if (def.props)
		{
			for (name in def.props)
			{
				props[name] = def.props[name];
			}
		}
		if (def.bind)
		{
			for (name in def.bind)
			{
				bind[name] = null;
				to.proto.prototype[name] = def.bind[name];
			}
		}
		if (def.members)
		{
			for (name in def.members)
			{
				to.proto.prototype[name] = def.members[name];
			}
		}
	};
	var appendChain = function(def, chain)
	{
		//console.log(['appendChain', def.type, def]);
		chain = chain || [];
		
		if (def.extend)
		{
			def.extend.forEach(function(sup, i)
			{
				//console.log(['appendChain', sup, i]);
				if (typeof sup == 'string')
				{
					if (sup in types)
					{
						sup = types[sup].def;
					}
					else
					{
						throw new Error('undefined required type ' + sup + ' for ' + def.type);
					}
				}
				if (chain.indexOf(sup) < 0)
				{
					chain.unshift(sup);
					if (sup.extend && sup.extend.length > 0)
					{
						appendChain(sup, chain);
					}
				}
				else
				{
					//console.log(['appendChain', 'recursion blocked on', def, sup]);
				}
			});
		}
		return chain;
	};
	
	return expose;
});