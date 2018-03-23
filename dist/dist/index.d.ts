import { Configuration } from './parser';
import Interpreter from './interp';
export declare class MCP {
    create_configuration(json: any): Configuration;
    create_interp(conf: Configuration): Interpreter;
}
