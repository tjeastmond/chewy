# chewy

Chewy converts a resume JSON file into publishable output files from the command line.

Supported outputs: `html`, `pdf`, `json`, `csv`, `yaml`, `txt`.

## Quick start

```bash
pnpm install
pnpm build
./bin/chewy --input ./resume.json
```

If `--input` is omitted, Chewy looks for `./resume.json` in your current directory.

By default, outputs are written to `./out`.

## How to use Chewy

### 1. Create a resume JSON file

Chewy validates your input using `resume.schema.json`.

Minimal example:

```json
{
  "name": "Alex Candidate",
  "title": "Senior Software Engineer",
  "contact": {
    "email": "alex@example.com",
    "phone": "555-0100",
    "location": "Austin, TX",
    "linkedin": "https://www.linkedin.com/in/alexcandidate",
    "github": "https://github.com/alexcandidate"
  },
  "summaries": {
    "default": "Senior engineer with experience building web products.",
    "backend": "Backend-focused engineer with API and platform depth."
  },
  "experience": [
    {
      "company": "Example Corp",
      "role": "Senior Engineer",
      "start": "2021-01",
      "end": null,
      "dates_display": "Jan 2021 - Present",
      "location": "Remote",
      "highlights": [
        "Led migration of core services.",
        "Reduced deploy time by 40%."
      ]
    }
  ],
  "skills": {
    "languages": ["TypeScript", "Python"],
    "platforms": ["AWS", "Docker"]
  },
  "role_targets": {
    "staffplus": {
      "keywords": ["architecture", "leadership"],
      "emphasis": {
        "summary": "backend",
        "skills_order": ["platforms", "languages"]
      }
    }
  },
  "projects": []
}
```

### 2. Run exports

Export all formats:

```bash
./bin/chewy --input ./resume.json --format all
```

Export only selected formats:

```bash
./bin/chewy --input ./resume.json --format html,pdf,txt
```

Set output directory:

```bash
./bin/chewy --input ./resume.json --out-dir ./dist/resume
```

Choose summary variant and role target (affects HTML/PDF rendering):

```bash
./bin/chewy --input ./resume.json --summary backend --role staffplus
```

Use a custom Handlebars template:

```bash
./bin/chewy --input ./resume.json --template ./templates/custom-resume.hbs
```

### 3. Pick output base filename when prompted

When running in an interactive terminal, Chewy prompts for output filename (without extension).

If you press Enter, it uses the input filename.

Example: input `resume.json`, selected formats `html,pdf`:

- `out/resume.html`
- `out/resume.pdf`

## CLI options

- `--help`, `-h`: Show usage and available options.
- `--input`, `-i`: Resume JSON path. Default: `./resume.json` (if present).
- `--out-dir`, `-o`: Output directory. Default: `./out`.
- `--format`, `-f`: `all` or comma-separated list of `html,pdf,json,csv,yaml,txt`.
- `--summary`: Summary key from `summaries`. Default: `default`.
- `--role`: Role key from `role_targets`. Default: `staffplus`.
- `--template`: Custom Handlebars template path.

## PDF requirement

PDF export requires a Chromium-based browser.

If auto-detection fails, set:

```bash
CHROME_PATH=/path/to/chrome ./bin/chewy --input ./resume.json --format pdf
```

## Validation and errors

- Invalid resume structure fails fast with a schema error.
- Missing `--input` and no `./resume.json` fails with an input error.
- Errors are printed in ASCII-safe text for terminal compatibility.
