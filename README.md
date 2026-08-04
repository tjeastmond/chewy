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
  "name": "Arthur Morgan",
  "title": "Senior Software Engineer",
  "contact": {
    "email": "arthur.morgan@example.com",
    "phone": "555-0100",
    "location": "Austin, TX",
    "linkedin": "https://www.linkedin.com/in/arthurmorgan",
    "github": "https://github.com/arthurmorgan"
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
      "highlights": ["Led migration of core services.", "Reduced deploy time by 40%."]
    }
  ],
  "skills": {
    "languages": ["TypeScript", "Python"],
    "platforms": ["AWS", "Docker"]
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

Choose summary variant:

```bash
./bin/chewy --input ./resume.json --summary backend
```

Use a custom Handlebars template:

```bash
./bin/chewy --input ./resume.json --template ./templates/custom-resume.hbs
```

### 3. Pick output base filename when prompted

Chewy requires a TTY terminal and prompts for output filename (without extension).

If you press Enter, it uses the input filename.

Before exporting, Chewy saves a timestamped backup of your input JSON to `./history/` (for example `history/1739188800_resume.json`).

Example: input `resume.json`, selected formats `html,pdf`:

- `out/resume.html`
- `out/resume.pdf`

## CLI options

- `--help`, `-h`: Show usage and available options.
- `--input`, `-i`: Resume JSON path. Default: `./resume.json` (if present).
- `--out-dir`, `-o`: Output directory. Default: `./out`.
- `--format`, `-f`: `all` or comma-separated list of `html,pdf,json,csv,yaml,txt`.
- `--summary`: Summary key from `summaries`. Default: `default`.
- `--template`: Custom Handlebars template path.

### Clean output directory

Remove all files in the output directory (default `./out`):

```bash
./bin/chewy clean
```

Clear a custom output directory:

```bash
./bin/chewy clean --out-dir ./dist/resume
```

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
