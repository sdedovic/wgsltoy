import { startShader } from './ts/renderer.ts';
import { defaultShader, setupEditor } from './ts/editor.ts';

const isWebGPUSupported = (): boolean => {
  return !!navigator.gpu;
}


const main = async () => {
  const { getEditorContents, displayErrors, clearErrors, setCompileCallback } = await setupEditor(defaultShader);

  if (isWebGPUSupported()) {
    document.getElementById("no-gpu-error").style.display = "none";
    document.getElementById("canvas").style.display = "block";

    const { updateUserFn } = await startShader(defaultShader);

    const makeShaderModule = async () => {
      const userShader = getEditorContents();
      const userShaderText = userShader.join("\n");

      let { success, errors } = await updateUserFn(userShaderText);
      if (success) {
        clearErrors();
      } else {
        displayErrors(errors);
      }
    };

    document.getElementById('compile').addEventListener('click', makeShaderModule);
    setCompileCallback(makeShaderModule);
  }
}

main()
  .catch(err => console.error(err));
