# Security

The app currently runs locally in the browser and handles user-provided files.

## Rules

- Treat imported JSON as untrusted.
- Do not execute imported file contents.
- Keep uploads as browser-local data URLs unless a future feature explicitly adds storage.
- Avoid logging full uploaded asset data.
- Add validation before accepting new project file versions.
