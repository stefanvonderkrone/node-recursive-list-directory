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
    name: "",
    stats: undefined
};

function wrapStat( path ) {
    return function( stats ) {
        return new Stats( path, stats );
    };
}

function lstat( path ) {
    return q.nfcall( fs.lstat, path )
        .then( wrapStat( path ) );
}

function listDirectory( path ) {
    return q.nfcall( fs.readdir, path );
}

function filterTree( cb, tree ) {
    if ( tree.isLeaf ) {
        return cb( tree.content ) ? new Leaf( tree.content ) : undefined;
    } else if ( tree.isBranch ) {
        if ( cb( tree.content ) ) {
            var children;
            children = _.chain( tree.children )
                .map( function( child ) {
                    return filterTree( cb, child );
                } )
                .filter( function( child ) {
                    return !!child;
                } )
                .value();
            if ( children.length === 0 ) {
                return new Leaf( tree.content );
            }
            return new Branch( tree.content, children );
        } else {
            return undefined;
        }
    } else {
        throw new Error( "no tree" );
    }
}

function mapTree( cb, tree ) {
    if ( tree.isLeaf ) {
        return new Leaf( cb( tree.content ) );
    } else if ( tree.isBranch ) {
        return new Branch( cb( tree.content ), _.map( tree.children, function( child ) {
            return mapTree( cb, child );
        } ) );
    } else {
        throw new Error( "no tree" );
    }
}

function eachTree( cb, tree ) {
    if ( tree.isLeaf ) {
        cb( tree.content );
    } else if ( tree.isBranch ) {
        cb( tree.content );
        _.each( tree.children, function( child ) {
            eachTree( cb, child );
        } );
    } else {
        throw new Error( "no tree" );
    }
}

function flattenTree( tree ) {
    if ( tree.isLeaf ) {
        return [ tree.content ];
    } else if ( tree.isBranch ) {
        return [ tree.content ]
            .concat( _.chain( tree.children )
                .map( flattenTree )
                .flatten()
                .value()
            );
    } else {
        throw new Error( "no tree" );
    }
}

function Tree() {}

Tree.prototype = {
    constructor: Tree,
    isLeaf: false,
    isBranch: false,
    content: undefined,
    children: undefined,
    filter: function( cb ) {
        return filterTree( cb, this );
    },
    map: function( cb ) {
        return mapTree( cb, this );
    },
    each: function( cb ) {
        return eachTree( cb, this );
    },
    flatten: function() {
        return flattenTree( this );
    }
};

function Leaf( content ) {
    this.content = content;
}

Leaf.prototype = _.assign( new Tree(), {
    constructor: Leaf,
    isLeaf: true
} );

function Branch( content, children ) {
    this.content = content;
    this.children = children;
}

Branch.prototype = _.assign( new Tree(), {
    constructor: Branch,
    children: [],
    isBranch: true
} );

function handleStat( stats ) {
    if ( stats.stats.isDirectory() ) {
        return listDirectory( stats.path )
            .then( function( files ) {
                return q.all(_.map( files, function( file ) {
                    var path = stats.path + "/" + file;
                    return lstat( path )
                        .then( function( stats ) {
                            stats.name = file;
                            return stats;
                        } )
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
