/**
 * Date: 07.01.15
 * Time: 14:46
 */

"use strict";

var fs = require("fs"),
    q = require("q"),
    _ = require("lodash");

function Stats( path, stats ) {
    this.path = path;
    this.stats = stats;
}

Stats.prototype = {
    constructor: Stats,
    path: "",
    stats: undefined
};

function wrapStat( path ) {
    return function( stats ) {
        return new Stats( path, stats );
    }
}

function lstat( path ) {
    return q.nfcall( fs.lstat, path )
        .then( wrapStat( path ) );
}

function listDirectory( path ) {
    return q.nfcall( fs.readdir, path );
}

function Tree() {}

Tree.prototype = {
    constructor: Tree,
    isLeaf: false,
    isBranch: false,
    content: undefined
};

function Leaf( content ) {
    this.content = content;
}

Leaf.prototype = _.assign( new Tree(), {
    constructor: Leaf
} );

function Branch( content, children ) {
    this.content = content;
    this.children = children;
}

Branch.prototype = _.assign( new Tree(), {
    constructor: Branch,
    children: []
} );

//Tree.createLeaf = function( content ) {
//
//};
//
//Tree.createBranch = function( contents ) {
//
//};

function handleStat( stats ) {
    if ( stats.stats.isDirectory() ) {
        return listDirectory( stats.path )
            .then( function( files ) {
                return q.all(_.map( files, function( file ) {
                    var path = stats.path + "/" + file;
                    return lstat( path )
                        .then( handleStat );
                } ) );
            } )
            .then( function( leafs ) {
                return new Branch( stats, leafs );
            } );
    } else {
        return new Leaf( stats );
    }
}

function ls( path ) {
    return lstat( path.charAt( 0 ) === "/" ? path : process.cwd() + "/" + path )
        .then( handleStat );
}

module.exports = ls;
