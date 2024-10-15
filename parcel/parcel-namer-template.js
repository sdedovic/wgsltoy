import {Namer} from '@parcel/plugin';
import path from "path";

export default new Namer({
    name({ bundle }) {
        if (bundle?.getMainEntry()?.type === 'htpp') {
            return 'templates/' + path.basename(bundle.getMainEntry().filePath);
        }
    }
});