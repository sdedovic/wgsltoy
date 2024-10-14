import {Namer} from '@parcel/plugin';
import namerDefault from '@parcel/namer-default';
import path from "path";

// Required to load plugin, see:
//  https://github.com/parcel-bundler/parcel/blob/v2/packages/core/core/src/loadParcelPlugin.js
const CONFIG = Symbol.for('parcel-plugin-config');

export default new Namer({
    name(input) {
        const defaultName = (namerDefault.default ? namerDefault.default : namerDefault)[CONFIG].name(input);

        const { bundle } = input;
        const directory = bundle.type === 'htpp' ? 'template' : 'static';

        return path.join(directory, defaultName);
    }
});