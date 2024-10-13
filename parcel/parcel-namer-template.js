import { Namer }  from '@parcel/plugin';
import namerDefault from '@parcel/namer-default';
import path from "path";

export default new Namer({
    name(input) {



        return namerDefault.default.name(input);

    }
});