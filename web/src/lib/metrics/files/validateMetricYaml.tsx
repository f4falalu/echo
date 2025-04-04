import React, { useRef } from 'react';
import * as yaml from 'js-yaml';
import * as monaco from 'monaco-editor';
import { type editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { useEffect } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';

type IMarkerData = editor.IMarkerData;

// Initial YAML content for testing
const initialValue = `Person: "John Doe"
Place: "Wonderland"
Age: 30
Siblings:
  Jane: 25
  Jim: 28`;

// Linting function that validates YAML content
export const validateMetricYaml = (content: string, monaco: any): IMarkerData[] => {
  const markers: IMarkerData[] = [];
  let parsed: any;

  // Parse YAML content
  try {
    parsed = yaml.load(content);
  } catch (error: any) {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: 'Invalid YAML 🤣: ' + error.message,
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    });
    return markers;
  }

  // Ensure the parsed result is an object
  if (typeof parsed !== 'object' || parsed === null) {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: 'YAML content should be an object with properties.',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    });
    return markers;
  }

  // Allowed keys
  const allowedKeys = ['Person', 'Place', 'Age', 'Siblings'];
  const keys = Object.keys(parsed);

  // Check for any unexpected keys
  keys.forEach((key) => {
    if (!allowedKeys.includes(key)) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `Unexpected key "${key}". Only ${allowedKeys.join(', ')} are allowed.`,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      });
    }
  });

  // Check for missing keys
  allowedKeys.forEach((key) => {
    if (!(key in parsed)) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: `Missing required key "${key}".`,
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      });
    }
  });

  // Validate types for each field
  if ('Person' in parsed && typeof parsed.Person !== 'string') {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: 'The "Person" field must be a string.',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    });
  }

  if ('Place' in parsed && typeof parsed.Place !== 'string') {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: 'The "Place" field must be a string.',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    });
  }

  if ('Age' in parsed && typeof parsed.Age !== 'number') {
    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: 'The "Age" field must be a number.',
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 1,
      endColumn: 1
    });
  }

  if ('Siblings' in parsed) {
    if (
      typeof parsed.Siblings !== 'object' ||
      Array.isArray(parsed.Siblings) ||
      parsed.Siblings === null
    ) {
      markers.push({
        severity: monaco.MarkerSeverity.Error,
        message: 'The "Siblings" field must be an object with sibling name-age pairs.',
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: 1,
        endColumn: 1
      });
    } else {
      // Validate that each sibling’s age is a number
      Object.entries(parsed.Siblings).forEach(([siblingName, siblingAge]) => {
        if (typeof siblingAge !== 'number') {
          markers.push({
            severity: monaco.MarkerSeverity.Error,
            message: `The age for sibling "${siblingName}" must be a number.`,
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
          });
        }
      });
    }
  }

  return markers;
};

export const MyYamlEditor: React.FC = () => {
  const editorRef = useRef<any>(null);

  // Called once the Monaco editor is mounted
  const editorDidMount = (editor: any, monacoInstance: typeof import('monaco-editor')) => {
    editorRef.current = editor;

    // Lint the document on every change
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      const markers = validateMetricYaml(value, monacoInstance);
      monacoInstance.editor.setModelMarkers(editor.getModel(), 'yaml', markers);
    });
  };

  return (
    <MonacoEditor
      width="800"
      height="600"
      language="yaml"
      className="h-full min-h-[600px] w-full min-w-[800px] border"
      theme="vs-light"
      value={initialValue}
      onMount={editorDidMount}
      options={{
        automaticLayout: true
      }}
    />
  );
};
