import path from 'path';
import {Transformer} from '@parcel/plugin';
import * as child_process from "node:child_process";

const resolveDependencies = async (filename) => {
    return new Promise((resolve, reject) => {
        child_process.execFile("htpp", ["--print-dependencies", filename], {}, (error, stdout) => {
            if (error) {
                return reject(error);
            }
            return resolve(stdout.split("\n").filter(line => line.trim() !== ""));
        })
    })
};

const render = async (filename, data) => {
    return new Promise((resolve, reject) => {
        const process = child_process.execFile("htpp", ["--std-in", filename], {}, (error, stdout) => {
            if (error) {
                return reject(error);
            }
            return resolve(stdout);
        });
        process.stdin.write(JSON.stringify(data));
    })
};

export default new Transformer({
    async loadConfig({config}) {
        let configFile = await config.getConfig([
            '.htpprc'
        ]);
        return configFile?.contents;
    },

    transform: async function ({asset, config, logger}) {

        // A template may extend other templates. Those should be processed by a different pipeline to skip rendering.
        const dependencies = await resolveDependencies(asset.filePath);
        for (let filePath of dependencies) {
            const pathToDependency = path.relative(path.dirname(asset.filePath), filePath);

            asset.invalidateOnFileChange(filePath);
            asset.addURLDependency(pathToDependency, {
                pipeline: "htpp-partial",
                needsStableName: true,
            });
        }

        let assets = [asset];

        const templateData = config ?? {};
        const html = await render(asset.filePath, templateData);
        let uniqueKey = `${asset.id}-html`;

        assets.push({
            type: 'html',
            content: html,
            uniqueKey,
            bundleBehavior: "isolated",
            meta: {ignore: true},
        });

        asset.addDependency({
            specifier: uniqueKey,
            specifierType: "url",
            needsStableName: true,
            meta: {ignore: true},
        })

        return assets;
    },
});