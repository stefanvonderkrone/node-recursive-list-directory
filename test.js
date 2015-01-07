/**
 * Date: 07.01.15
 * Time: 15:07
 */

"use strict";

require( "./index.js" )( process.cwd() )
    .then( function( fsTree ) {
        console.log( JSON.stringify( fsTree, undefined, "  " ) );
    }, function( err ) {
        console.log( "Error:", err );
    } );
