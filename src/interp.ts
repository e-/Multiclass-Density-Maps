// Interpreter from a parsed specification

import * as Parser from './parser';

export class Interpreter {
    public width: number;
    public height: number;

    constructor(public configuration:Parser.Configuration) {
        if (! configuration.validate())
            throw "Invalid configuration";
        this.width = configuration.width!;
        this.height = configuration.height!;
    }
    
}
