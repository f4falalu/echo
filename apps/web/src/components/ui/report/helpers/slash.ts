import { KEYS, type Path, PathApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';

export function insertSlashBelow(editor: PlateEditor, placeholder: string, currentPath: Path) {
  const slashType = editor.getType(KEYS.slashInput);
  if (!slashType) return; // plugin not registered, bail. :contentReference[oaicite:1]{index=1}

  // 1) Resolve the block at currentPath (works whether or not there's a selection)
  const blockEntry = editor.api.block({ at: currentPath });
  if (!blockEntry) return;
  const [, blockPath] = blockEntry;

  // 2) Compute the insertion path reliably (even if it's the last sibling)
  const insertPath = PathApi.next(blockPath); // safe “after” path. :contentReference[oaicite:2]{index=2}

  // 3) Insert a fresh default block and place the caret at its start
  const newBlock = editor.api.create.block(); // empty paragraph (or your default)
  editor.tf.insertNodes(newBlock, { at: insertPath }); // :contentReference[oaicite:3]{index=3}
  const startPoint = editor.api.start(insertPath);
  if (startPoint) editor.tf.select(startPoint);

  // 4) Trigger the slash combobox; this will create the slash input (type = KEYS.slashInput)
  editor.tf.focus();
  editor.tf.insertText('/'); // :contentReference[oaicite:4]{index=4}

  // 5) Set a per-node placeholder on the just-created SlashInput
  const inputEntry = editor.api.above({
    at: editor.selection ?? insertPath,
    match: { type: slashType },
  });

  if (inputEntry) {
    const [, inputPath] = inputEntry;
    editor.tf.setNodes({ placeholder }, { at: inputPath }); // :contentReference[oaicite:5]{index=5}
  } else {
    // Fallback: explicitly insert the input with the placeholder
    editor.tf.insertNodes(
      { type: slashType, placeholder, children: [{ text: '' }] },
      { at: editor.selection ?? editor.api.start(insertPath) }
    ); // :contentReference[oaicite:6]{index=6}
  }
}
