import { Decoration, DecorationSet, EditorView, keymap, lineNumbers, WidgetType } from '@codemirror/view';
import { ErrorMessage } from './renderer.ts';
import { EditorState, StateEffect, StateField } from '@codemirror/state';

export const defaultShader = `// Shader Inputs
// uniform vec3      iResolution;           // viewport resolution (in pixels)
// uniform float     iTime;                 // shader playback time (in seconds)
// uniform float     iTimeDelta;            // render time (in seconds)

fn mainImage(fragCoord: vec2f) -> vec4f
{
  // Normalized pixel coordinates (from 0 to 1)
  let uv = fragCoord.xy / iResolution.xy;
  
  // Time varying pixel color
  let col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3f(0, 2, 4));

  // Output to screen
  return vec4(col, 1.0);
}`;

class ErrorWidget extends WidgetType {
  constructor(readonly message: ErrorMessage) {
    super()
  }

  eq(other: ErrorWidget): boolean {
    return other.message == this.message
  }

  toDOM(): HTMLElement {
    const leftPad = this.message.linePos - 1;
    const text = this.message.message
      .split("\n")
      .map((txt, idx) => idx > 0 ? ' '.repeat(leftPad) + txt : txt)
      .join('\n');

    const line = document.createElement("div");
    line.className = "error-line";
    line.innerHTML = text;
    return line;
  }
}

const makeErrors = (errors: ErrorMessage[], state: EditorState): DecorationSet => {
  const widgets = errors.map(error => {
    const { lineNum } = error;
    const deco = Decoration.widget({
      widget: new ErrorWidget(error),
      block: true,
    });
    return deco.range(state.doc.line(lineNum).from);
  });

  return Decoration.set(widgets);
}

const setErrors = StateEffect.define<ErrorMessage[]>();
const clearErrors = StateEffect.define<ErrorMessage[]>();
const errorDecorations = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(previous, transaction) {
    for (let e of transaction.effects) {
      if (e.is(setErrors)) {
        return makeErrors(e.value, transaction.state);
      }
      else if (e.is(clearErrors)) {
        return Decoration.none;
      }
    }
    return previous;
  },
  provide: f => EditorView.decorations.from(f),
});

export const setupEditor = async (doc: string) => {
  const editor = new EditorView({
    doc,
    extensions: [
      lineNumbers()
    ],
    parent: document.getElementById("editor"),
  });

  const getEditorContents = () => {
    return editor.state.doc.toJSON();
  };

  const displayErrors = (errors: ErrorMessage[]) => {
    const effects: StateEffect<any>[] = [setErrors.of(errors)];

    if (!editor.state.field(errorDecorations, false)) {
      effects.push(StateEffect.appendConfig.of(errorDecorations));
    }

    editor.dispatch({ effects });
  }

  const clearErrors = () => {
    const effects = [setErrors.of([])];
    editor.dispatch({ effects });
  }

  const setCompileCallback = (callback: () => Promise<void>) => {
    const effects = [
      StateEffect.appendConfig.of(keymap.of([{
        key: "Mod-Enter",
        preventDefault: true,
        run: callback,
      }]))
    ];
    editor.dispatch({ effects });
  };

  return {
    getEditorContents,
    displayErrors,
    clearErrors,
    setCompileCallback,
  };
};
