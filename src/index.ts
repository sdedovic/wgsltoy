import { startShader } from './renderer.ts';
import { defaultShader, setupEditor } from './editor.ts';



const main = async () => {
  const { getEditorContents, displayErrors, clearErrors } = await setupEditor(defaultShader);
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
  const btn = document.getElementById('compile');
  btn.addEventListener('click', makeShaderModule);
}

main()
  .catch(err => console.error(err));
