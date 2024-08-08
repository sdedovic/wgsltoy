import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

const included = {};

async function resolveLygiaAsync(text, current_file) {
  const lines = text.split(/\r?\n/);
  const response = await Promise.all(
    lines.map(async line => {
      const line_trim = line.trim();

      if (line_trim.startsWith('#include')) {
        let include_file;

        // fully path
        if (line_trim.startsWith('#include "lygia')) {
          include_file = line_trim.substring(15);
        }
        // relative path
        else if (line_trim.startsWith('#include "')) {
          const rel_path = line_trim.substring(10);
          include_file = path.join(current_file, '..', rel_path);
        }
        // idk?
        else {
          console.error(`Unknown #import style! [{line_trim}]`);
          process.exit(2);
        }

        // if we have not seen this file yet
        if (!included[include_file]) {
          const url = "https://lygia.xyz" + include_file.replace(/\"|\;|\s/g, "");
          const file_text = await fetch(url).then((res) => res.text()); // TODO: handle 404 / failure

          // mark this file as processed to avoid including it multiple times
          included[include_file] = true;
          return await resolveLygiaAsync(file_text, include_file);
        }
      } else
        return line;
    })
  );

  return response.join("\n");
}

async function main() {
  const filePath = process.argv[2];
  const text = await readFile(filePath, { encoding: 'utf8' });
  const output = await resolveLygiaAsync(text);
  console.log(output);
}

main()
  .then(() => process.exit())
  .catch(err => console.error(err))
  .then(() => process.exit(1));
