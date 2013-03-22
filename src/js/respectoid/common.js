define(['respectoid/protoid'], function (protoid)
{
	/*

	 */
	var expose = {};

	var uid = Math.round(Math.random() * Math.pow(10, 3));
	protoid('common.UID').construct(function ()
	{
		this.uid = (++uid);
	});

	protoid('common.Point').property({
		x: 0,
		y: 0
	}).init(function (x, y)
	{
		this.x = x || 0;
		this.y = y || 0;

	}).member({
		reset: function ()
		{
			this.x = 0;
			this.y = 0;
		}
	});

	protoid('common.Name').extend('common.UID').construct(function ()
	{
		this.name = 'instance_' + this.uid;
	});

	protoid('common.Size').construct(function ()
	{
		this.size = 10;
	}).member({
		scale: function (scale)
		{
			this.size *= scale;
		}
	});

	/*
	 protoid('common.Bound').scope(function (def)
	 {
	 def.construct(function ()
	 {
	 this.size = 10;
	 }).member({
	 scale: function (scale)
	 {
	 this.size *= scale;
	 }
	 });
	 });
	 */
	protoid('common.Display', expose).extend([
		'common.Size',
		'common.Name'
	]).construct(function ()
	{
		this.position = protoid('common.Point').create();
		this.speed = protoid('common.Point').create(300, 500);

	}).init(function (x, y)
	{
		this.position.x = x || 0;
		this.position.y = y || 0;

	}).member({
		visible: true

	}).property({
		color: 0xFF2288,
		alpha: 0

	}).constant({
		ratio: 12

	}).getset({
		stage: {
			_stage: null,
			get: function ()
			{
				return this._stage;
			}
		},
		parent: {
			_parent: null,
			get: function ()
			{
				return this._parent;
			},
			set: function (parent)
			{
				console.log(['set parent preset', parent, this._parent]);
				this._parent = parent;
				console.log(['set parent changed', parent, this._parent, this.parent]);
			}
		}
	}).define({
		hidden: {
			enumerable: false,
			configurable: false,
			writable: false,
			value: 'hidden'
		}
	}).bound({
		handleEvent: function (data)
		{
			console.log(data);
		}
	}).locking(true);

	return expose;
});