import {Configuration} from './parser';
import Interpreter from './interp';

export class MCP {
    create_configuration(json:any) {
        return new Configuration(json);
    }

    create_interp(conf:Configuration) {
        return new Interpreter(conf);
    }
};
