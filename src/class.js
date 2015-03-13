/**
 * Class
 * A class initialiser for Javascript
 *
 * Based upon John Resigs "Simple Javascript Inheritance"
 * http://is.gd/5Js7qK
 *
 * TODO Implements
 */
define(function()
{
	// Setting up...
	var classID     = 0;
	var instanceID  = 0;
	var initFlag    = true;
	var initDefault = function() {};
	var returnTrue  = function() { return true; };
	var returnFalse = function() { return false; };
	var extendFn    = function(newMethods)
	{
		newMethods.Extends = this;
		return Class(newMethods);
	};

	var Class = function(newMethods)
	{
		// Create the new class
		var newClass = function Class()
		{
			if(initFlag)
			{
				if(isBase)
					throw new Error('Base class cannot be instantiated');

				//this.classID = newClass.classID;
				//this.instanceID = instanceID++;

				this.init.apply(this, arguments);
			}
		};

		// Can be initialized with a plain object or function
		switch(typeof newMethods)
		{
			case 'object': break;

			case 'function':
				var o = {};
				newMethods.call(o, newClass);
				newMethods = o;
				o = null;
				break;

			default:
				throw new TypeError('Class may only be created from a plain object or function');
		}

		var superClass = null;
		var isBase  = newMethods.Base  === true;
		var isFinal = newMethods.Final === true;
		var newProto;

		delete newMethods.Base;
		delete newMethods.Final;

		// Is this class extending another?
		if(typeof newMethods.Extends == 'function')
		{
			superClass = newMethods.Extends;

			if(superClass.isFinalClass && superClass.isFinalClass())
				throw new Error('Extending class is marked as final and may not be extended');

			// Extend the class onto the new prototype
			// Do not call the init(ializer)
			initFlag = false;
			newProto = new superClass();
			initFlag = true;
		}
		// Make sure that we don't unnecessarily overwrite the original prototype (faster lookup)
		else newProto = newClass.prototype || {};

		// Clean up methods
		delete newMethods.Extends;

		// Pass the newly defined methods over to the new prototype
		for(var methodName in newMethods) if(newMethods.hasOwnProperty(methodName))
		{
			newProto[methodName] = newMethods[methodName];
		}

		// If the new prototype does not have an init function, default it
		if(typeof newProto.init != 'function')
			newProto.init = initDefault;

		// Assignments
		newProto.constructor  = newClass;
		newClass.classID      = classID++;
		newClass.prototype    = newProto;
		newClass.fn           = newProto; // Shortcut for Class.prototype
		newClass.superClass   = superClass;
		newClass.isBaseClass  = isBase  ? returnTrue : returnFalse;
		newClass.isFinalClass = isFinal ? returnTrue : returnFalse;
		newClass.extend       = extendFn;

		// Class is packaged and ready to be posted!
		return newClass;
	};

	return Class;
});