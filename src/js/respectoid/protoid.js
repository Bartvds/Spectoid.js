define(function()
{
	var types = {};
	var expose;


	/*
		core chainable type lookup as export value
	*/
	var protoid = expose = function(type, expose)
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
	/*
		compile all
	*/
	var compile = expose.compile = function()
	{
		for (var type in types)
		{
			var def = types[type];
			if(!def.compiled) def.compiled = def.def.compile();
			if(!def.compiled) throw new Error('error compiling type ' + type);
		}
	};
	/*
		accessors
	*/
	var hasType = expose.hasType = function(type)
	{
		return type in types[type];
	};
	var getType = expose.getType = function()
	{
		if (type in types) return types[type];
		return null;
	};

	/*
		chainable type definition builder
	 */
	var DefType = function(type)
	{
		this.type = type;
		this.def = new Def(type);
		this.compiled = false;
	};
	/*
		extend from other types by merging traits
	 */
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
	/*
		constructor called for every instance including sub type instances
	 */
	DefType.prototype.construct = function(construct)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.construct = construct;
		construct.type = this.def.type;
		return this;
	};
	/*
		 init instance optionally called of types own instances
	*/
	DefType.prototype.init = function(init)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.init = init;
		return this;
	};
	/*
		set instance instanceProps
	 */
	DefType.prototype.property = function(props)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);

		var context = new Expansion(this, 'property');

		for (var name in props)
		{
			this.def.steps.addMember(new Member(context, name, [new InstProp(props[name])]));
		}
		return this;
	};
	/*
		 define prototype instanceProps
	 */
	DefType.prototype.member = function(members)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);

		var context = new Expansion(this, 'member');

		for (var name in members)
		{
			var value = members[name];
			var mem = this.def.steps.addMember(new Member(context, name, [new ProtoProp(value)]));
			if (typeof value == 'function')
			{
				mem.addTrait(new DefProtoProp({enumerable:(typeof value !== 'function')}));
			}
		}
		return this;
	};
	/*
		bind methods to
	 */
	DefType.prototype.bound = function(methods)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);

		var context = new Expansion(this, 'bound');

		for (var name in methods)
		{
			if (typeof methods[name] !== 'function') throw new Error('cannot bind a non-function '+ name + ' on ' + this.type);
			this.def.bind[name] = null;
			this.def.steps.addMember(new Member(context, name, [new DefProtoProp({value: methods[name], enumerable:false})]));
		}
		return this;
	};

	/*
	 getter and setters
	 */
	DefType.prototype.constant = function(props)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);

		var context = new Expansion(this, 'constant');

		for (var name in props)
		{
			this.def.steps.addMember(new Member(context, name, [new DefProtoProp({value: props[name], writable:false, enumerable:true, configurable:false})]));
		}
		return this;
	};
	/*
		 getter and setters
	 */
	DefType.prototype.getset = function(props)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);

		var context = new Expansion(this, 'getset');

		var params = ['get','set'];
		for (var name in props)
		{
			var data = props[name];
			var desc = {enumerable:true};

			for (var key in data)
			{
				if (params.indexOf(key) > -1)
				{
					desc[key] = data[key];
				}
				else
				{
					//semi-private fields
					this.def.steps.addMember(new Member(context, key, [new InstProp(data[key]), new DefInstProp({enumerable:false})]));
				}
			}
			this.def.steps.addMember(new Member(context, name, [new DefProtoProp(desc)]));
		}
		return this;
	};
	/*
	 define instanceProps on prototype with default value set on instance
	 */
	DefType.prototype.define = function(props)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);

		var context = new Expansion(this, 'define');

		for (var name in props)
		{
			var prop = props[name];
			this.def.steps.addMember(new Member(context, name, new DefInstProp(prop)));
			/*if (typeof prop.value !== 'undefined')
			{
				this.def.instanceProps[name] = prop.value;
			}*/
		}
		return this;
	};
	/*
	 	seal and/or freeze instances
	 */
	DefType.prototype.locking = function(seal, freeze)
	{
		if (this.compiled) throw new Error('type compiled, cannot modify ' + this.type);
		this.def.sealInstance = seal;
		this.def.freezeInstance = freeze;
		return this;
	};
	/*
	 	get an instance, pass arguments to init
	 */
	var c = 0;
	DefType.prototype.create = function(__args)
	{
		console.log(['create', this.type]);
		this.compiled = this.compiled || this.def.compile();
		if (this.compiled)
		{
			var instance = Object.create(this.def.proto);
			this.def.decorate(instance, arguments);
			instance.c = (c++);
			return instance;
		}
		return null;
	};

	var getNamedConstructor = function(name)
	{
		name = (name = name.split(/[^\w]+/))[name.length-1];
		var src = '';
		src += 'function ' + name + '(){};\n';
		src += 'return new ' + name + '();';
		return new Function(src).call(null);
	};
	/*
	 definition data
	 */
	var Def = function(type)
	{
		this.type = type;
		this.construct = null;
		this.extend = [];
		this.bind = {};
		this.sealInstance = false;
		this.freezeInstance = false;

		this.steps = new Chain();

		this.chain = null;
		this.proto = null;
		this.decorate = null;
		this.compiled = false;
	};
	/*
	 compile type
	 */
	Def.prototype.compile = function()
	{
		if (this.compiled) throw new Error('type compiled, cannot recompile ' + this.type);
		console.log(['Def.compile', this.type, this]);

		this.compiled = false;
		this.chain = appendTypeChain(this, [this]);
		this.proto = getNamedConstructor(this.type);
		this.proto.name = this.type;

		var members = new Chain();
		var scope = new Scope(this.type);

		scope.init = this.init;
		scope.sealInstance = this.sealInstance;
		scope.freezeInstance = this.freezeInstance;

		addDefParts(members, this, scope);

		var sup;
		for (i = 0, ii = this.chain.length; i < ii; i++)
		{
			sup = this.chain[i];
			addDefParts(members, sup, scope);
		}
		console.log(members);

		var member;
		var j, jj;
		for (i = 0, ii = members.list.length; i < ii; i++)
		{
			member = members.list[i];
			member.expose(scope);
		}
		console.log(scope);

		for (name in scope.prototypeProps)
		{
			console.log(['prototypeProps', name, scope.prototypeProps[name]]);
			this.proto[name] = scope.prototypeProps[name];
		}
		for (name in scope.prototypePropDefs)
		{
			console.log(['prototypePropDefs', name, scope.prototypePropDefs[name]]);
			Object.defineProperty(this.proto, name, scope.prototypePropDefs[name]);
		}

		//TODO find way to clean or unroll unused loops
		this.decorate = function (target, args)
		{
			console.log(['decorate', scope.type, target]);
			var type;
			var i, ii;
			for (i in scope.instanceProps)
			{
				target[i] = scope.instanceProps[i];
				console.log(['decorate', scope.type, 'props', i, scope.instanceProps[i]]);
			}
			for (i = 0, ii = scope.bind.length; i < ii; i++)
			{
				target[scope.bind[i]] = bindTo(target[scope.bind[i]], target);
			}

			for (name in scope.instancePropDefs)
			{
				console.log(['decorate', scope.type, 'instancePropDefs', name, scope.instancePropDefs[name]]);
				Object.defineProperty(target, name, scope.instancePropDefs[name]);
			}
			for (i = 0, ii = scope.constructors.length; i < ii; i++)
			{
				console.log(['decorate', scope.type, 'constructors', scope.constructors[i].type, scope.constructors[i]]);
				scope.constructors[i].call(target);
			}
			if(scope.init)
			{
				console.log(['decorate', scope.type, 'init', scope.init, args]);
				scope.init.apply(target, args);
			}
			if (scope.sealInstance)
			{
				console.log(['decorate', scope.type, 'sealInstance']);
				Object.seal(target);
			}
			if (scope.freezeInstance)
			{
				console.log(['decorate', scope.type, 'freezeInstance']);
				Object.freeze(target);
			}
			console.log(['decorate completed', scope.type, target]);
		};

		this.compiled = true;
		console.log(['Def.compile done', this.type, this]);
		return this.compiled;
	};

	//loose utils
	var addDefParts = function(members, def, scope)
	{
		var i, ii, name;

		members.appendChain(def.steps);

		var tmp = [];
		for (name in def.bind)
		{
			scope.bind.push(name);
		}
		if (def.construct)
		{
			scope.constructors.push(def.construct);
		}
	};
	var appendTypeChain = function(def, chain)
	{
		//console.log(['appendTypeChain', def.type, def]);
		chain = chain || [];

		if (def.extend)
		{
			def.extend.forEach(function(sup, i)
			{
				//console.log(['appendTypeChain', sup, i]);
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
					//front
					chain.unshift(sup);
					if (sup.extend && sup.extend.length > 0)
					{
						appendTypeChain(sup, chain);
					}
				}
				else
				{
					//console.log(['appendTypeChain', 'recursion blocked on', def, sup]);
				}
			});
		}
		return chain;
	};
	var bindTo = function(func, scope)
	{
		return function()
		{
			return func.apply(scope, arguments);
		};
	};

	var expansionUID = 0;
	var Expansion = function Expansion (def, label)
	{
		this.def = def;
		this.label = label;
		this.iid = (expansionUID++);
	};

	var Chain = function Chain()
	{
		this.list = [];
		this.order = [];
		this.map = {};
	};
	Chain.prototype.addMember = function(member)
	{
		this.order.push(member);
		if (!(member.name in this.map))
		{
			this.list.push(member);
			this.map[member.name] = [member]
		}
		else
		{
			this.map[member.name].push(member);
		}
		return member;
	};
	Chain.prototype.appendChain = function(source)
	{
		for (var i = 0, ii = source.list.length; i < ii; i++)
		{
			this.addMember(source.list[i]);
		}
	};
	Chain.prototype.cloneChain = function()
	{
		var clone = new Chain();
		clone.list = this.list.concat();
		for (var name in this.map)
		{
			clone.map[name] = this.map[name];
		}
	};

	var Member = function Member (origin, name, traits)
	{
		this.origin = origin;
		this.by = origin.def.type;
		this.name = name;
		this.traits = traits || [];
		for (var i = 0, ii = this.traits.length; i < ii; i++)
		{
			if (!this.traits[i])
			{
				console.log(['Member', name, origin]);
			}
			this.traits[i].member = this;
		}
	};
	Member.prototype.addTrait = function(trait)
	{
		trait.member = this;
		this.traits.push(trait);
		return this;
	};
	Member.prototype.expose = function(scope)
	{
		for (var i = 0, ii = this.traits.length; i < ii; i++)
		{
			var trait = this.traits[i];
			trait.expose(scope);
		}
	};

	var Scope = function Scope(type)
	{
		this.type = type;
		this.instancePropDefs = {};
		this.prototypePropDefs = {};
		this.instanceProps = {};
		this.prototypeProps = {};
		this.constructors = [];
		this.bind = [];
		this.init = null;
		this.sealInstance = false;
		this.freezeInstance = false;
	};

	var Trait = function Trait (label, instance, proto)
	{
		this.label = label;
		this.touchInstance = instance;
		this.touchPrototype = proto;
		this.member = null;
	};

	var InstProp = function InstProp (value)
	{
		Trait.call(this, 'InstProp', true, false);
		this.value = value;
	};
	InstProp.prototype = Object.create(Trait.prototype);
	InstProp.prototype.expose = function(scope)
	{
		scope.instanceProps[this.member.name] = this.value;
	};

	var ProtoProp = function ProtoProp (value)
	{
		Trait.call(this, 'ProtoProp',false, true);
		this.value = value;
	};
	ProtoProp.prototype = Object.create(Trait.prototype);
	ProtoProp.prototype.expose = function(scope)
	{
		scope.prototypeProps[this.member.name] = this.value;
	};

	var DefInstProp = function DefInstProp (desc)
	{
		Trait.call(this, 'DefInstProp', true, false);
		this.desc = desc;
	};
	DefInstProp.prototype = Object.create(Trait.prototype);
	DefInstProp.prototype.expose = function(scope)
	{
		scope.instancePropDefs[this.member.name] = this.desc;
	};
	var DefProtoProp = function DefProtoProp (desc)
	{
		Trait.call(this, 'DefProtoProp', false, true);
		this.desc = desc;
	};
	DefProtoProp.prototype = Object.create(Trait.prototype);
	DefProtoProp.prototype.expose = function(scope)
	{
		scope.prototypePropDefs[this.member.name] = this.desc;
	};

	return expose;
});