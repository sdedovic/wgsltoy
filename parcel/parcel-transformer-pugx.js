import path from 'path';
import { Transformer } from '@parcel/plugin';
import pug from 'pug';

export default new Transformer({
    async loadConfig({config}) {
        let configFile = await config.getConfig([
            '.pugrc',
            '.pugrc.js',
            '.pugrc.cjs',
            '.pugrc.mjs',
            'pug.config.js',
            'pug.config.cjs',
            'pug.config.mjs',
        ]);

        return configFile?.contents;
    },

    transform: async function ({asset, config}) {
        const pugConfig = config ?? {};
        const content = await asset.getCode();
        const render = pug.compile(content, {
            compileDebug: false,
            basedir: path.dirname(asset.filePath),
            filename: asset.filePath,
            ...pugConfig,
            pretty: pugConfig.pretty || false,
        });

        for (let filePath of render.dependencies) {
            asset.invalidateOnFileChange(filePath);
        }

        let assets = [asset];

        let uniqueKey = `${asset.id}-html`;
        assets.push({
            type: 'html',
            content: render(pugConfig.locals),
            // uniqueKey,
        });

        // asset.addDependency({
        //     specifier: uniqueKey,
        //     specifierType: "url",
        // })

        return assets;
    },
});