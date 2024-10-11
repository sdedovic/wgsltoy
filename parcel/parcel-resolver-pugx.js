import { Resolver } from '@parcel/plugin';

export default new Resolver({
    async resolve(x) {
        if (!x?.dependency?.sourcePath) {
            return null;
        }

        if (x.dependency.sourcePath.endsWith(".pug") &&
            !(x.specifier.endsWith(".css") || x.specifier.endsWith(".js"))) {
            return { isExcluded: true };
        }

        return null;
    }
});