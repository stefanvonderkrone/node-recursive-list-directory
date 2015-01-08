/**
 * Date: 07.01.15
 * Time: 15:07
 */

"use strict";

require( "./index.js" )( process.cwd() )
    .then( function( fsTree ) {
        fsTree = fsTree
            .filter( function( content ) {
                return content.stats.isDirectory();
            } )
            .map( function( content ) {
                return content.path;
                //return {
                //    path: content.path,
                //    name: content.name
                //};
            } )
            .flatten();
        console.log( JSON.stringify( fsTree, undefined, "  " ) );
    }, function( err ) {
        console.log( "Error:", err );
    } );
