
var util = require('util');

if( typeof exports == 'undefined' ){ global.exports = {}; }


function Val( val ){
  this.val = val;
}
Val.prototype = {
  isEmpty: function(){
    if( this.val == null ){
      return true;
    }
    switch ( this.val.constructor.name ) {
      case 'Boolean':
        return false;
      case 'Array':
        return this.val.length == 0;
      default:
        return !Boolean( this.val );
    }
  },
  toString: function(){
    return this.isEmpty()? '' : this._toCode();
  },
  _toCode: function(){
    return this.toCode ? this.toCode() : this.val;
  }
};


function QuotedVal( val ){
  Val.call( this, val );
}
util.inherits( QuotedVal, Val );
QuotedVal.prototype.toCode = function(){
  return "'" + this.val + "'";
};


function LengthVal( val ){
  Val.call( this, val );
}
util.inherits( LengthVal, Val );
LengthVal.prototype.toCode = function(){
  return '( ' + this.val +' )';
};


function ValuesVal( val ){
  Val.call( this, val );
}
util.inherits( ValuesVal, Val );
ValuesVal.prototype.toCode = function(){
  return '( ' + JSON.stringify( this.val ).slice(1,-1) +' )';
};



function Field( attr ){
  var options = attr.type.options || {};

  this.type = attr.type.key;
  this.name = attr.field;

  this.autoIncrement = new Val( attr.autoIncrement );
  this.allowNull     = new Val( attr.allowNull );
  this.primaryKey    = new Val( attr.primaryKey );
  this.onDelete      = new QuotedVal( attr.onDelete );
  this.onUpdate      = new QuotedVal( attr.onUpdate );

  this.references    = attr.references;

  this.unsigned      = options.unsigned;
  this.values        = new ValuesVal( options.values );
  this.length        = new LengthVal( options.length );

}

Field.opts = [
  'autoIncrement',
  'allowNull',
  'primaryKey',
  'onDelete',
  'onUpdate'
];

exports.Field = Field;




function Model( model ){
  this.tableName = model.tableName;
  this.uniqueKeys = model.uniqueKeys;
  this.fields = Object.keys( model.attributes ).map( function( key ){
    return new Field( model.attributes[key] );
  });
}
exports.Model = Model;




if( require.main == module ){
  
  var models = require('./models');
  var ect  = require('ect')();
  var fs = require( 'fs');

  [
    'model1',
    'model2',
    'model3',
    'model4',
    'model5',

  ].forEach( function(modelName, i ){
    var m = new Model( models[modelName] );
      var out = ect.render('./data/migration-file.js.ect', { model: m, fieldOpts: Field.opts });
    var timestamp = new Date( Date.now() + i ).toISOString().replace(/[-:.TZ]/g, '');
    fs.writeFileSync( './migrations/' + timestamp + '-create_table_' + modelName + '_mi-generated.js', out );
  });

}



