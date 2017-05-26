#!/usr/bin/env node

var path = require('path');
var ect  = require('ect')();
var fs = require( 'fs');
var Classes = require( '../index');

var log = console.log.bind( console, 'SMG: ' );
var TEMPLATE = path.resolve( __dirname + '/../data/migration-file.js.ect' );
var Model = Classes.Model;
var Field = Classes.Field;
var modelsDir = process.argv[2];
var migrationsDir = process.argv[3];
var Sequelize = require("sequelize");
var sequelize = new Sequelize();


function getAbsPath( relPath ){
  return path.resolve( relPath );
}


function getTimeStamp( i ){
   return new Date( Date.now() + i ).toISOString().replace(/[-:.TZ]/g, '');
}


function genMigration(model, i ){
  log( 'Generating migration for ', model );
  var m = new Model( model );
  var out = ect.render( TEMPLATE, { model: m, fieldOpts: Field.opts });
  var timestamp = getTimeStamp( i );
  var fname = timestamp + '-create_table_' + model.name + '_mi-generated.js';

  fs.writeFileSync( path.join( migrationsDir, fname ), out );
}


function createDir( pathName ){
  if( !fs.existsSync( pathName ) ){
    fs.mkdirSync( pathName );
  }
}

function importModels( modelDir ){

  fs.readdirSync( modelsDir )
    .filter( v => v.match(/\.model\.js/) )
    .forEach(function(file) {
       sequelize.import( path.join(modelsDir, file));
    });
  var models = sequelize.models;

  Object.keys(models).forEach(function(modelName) {
    if ( models[modelName].associate) {
      models[modelName].associate(models);
    }
  });
  return models;
}


function main(){
  modelsDir = getAbsPath( modelsDir );
  migrationsDir = getAbsPath( migrationsDir );
  createDir( migrationsDir );
  log( 'modelsDir', modelsDir );
  var models = importModels( modelsDir );

  Object.keys( models )
    .forEach( function( modelName, i){
      genMigration( models[ modelName ], i );
    });
}



if( !( modelsDir && migrationsDir )){
  console.log( 'Usage: sequelize-migration-generator <models_directory> <migration_directory>');
} else {
  main();
}
