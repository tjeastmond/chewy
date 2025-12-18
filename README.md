# chewy

Export a resume JSON file into multiple formats from the command line.

## Install

This repo builds local CLI binaries named `chewy` and `chewy-server`.

```bash
pnpm install
pnpm build
```

## Usage

Run the CLI:

```bash
chewy --input ./resume.json
```

If `--input` is not provided, the CLI looks for `./tjeastmond.json` or `./resume.json` in the current directory.

Serve the rendered resume HTML:

```bash
chewy-server --input ./resume.json
```

## Options

- **`--input`, `-i`**: Path to a resume JSON file.
- **`--out-dir`, `-o`**: Output directory (default: current directory).
- **`--format`, `-f`**: Output formats (default: `html,pdf,json,csv,yaml,txt`)
  - Use `all` for all formats
  - Or provide a comma-separated list, e.g. `html,json,txt`
- **`--summary`**: Summary key to render in HTML (default: `default`)
- **`--role`**: Role key used for role-targeted rendering in HTML (default: `staffplus`)
- **`--template`**: Path to a Handlebars HTML template (default: `templates/resume.hbs`)

## Output files

Outputs are written to `--out-dir` using the input filename as the base name.

Example: `--input ./resume.json --format html,json` writes:

- `./resume.html`
- `./resume.json`

Note: `pdf` export uses a local Chrome/Chromium executable in headless mode. If it’s not found on your system, set `CHROME_PATH` to the browser executable path.

## Examples

Export everything to `./out`:

```bash
chewy --input ./resume.json --out-dir ./out --format all
```

Export only HTML and TXT:

```bash
chewy -i ./resume.json -f html,txt
```

Use a custom template and select which summary/role to render:

```bash
chewy -i ./resume.json --template ./template.html --summary default --role staffplus
```
