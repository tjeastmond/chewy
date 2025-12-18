import { readFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'

import { ResumeSchema, type Resume } from './resume/schema.js'
import { renderHtml } from './resume/renderHtml.js'

export type CreateResumeServerOptions = {
  cwd?: string
  inputPath?: string
  summaryKey?: string
  roleKey?: string
  templatePath?: string
}

async function findDefaultInput(cwd: string): Promise<string> {
  const candidates = ['resume.json', 'tjeastmond.json']
  for (const c of candidates) {
    const full = path.resolve(cwd, c)
    try {
      await readFile(full, 'utf8')
      return full
    } catch {
      // continue
    }
  }
  throw new Error(
    'No input provided and no default resume JSON found in current directory (resume.json or tjeastmond.json).'
  )
}

async function loadResume(inputPath: string): Promise<Resume> {
  const raw = await readFile(inputPath, 'utf8')
  const json = JSON.parse(raw) as unknown
  return ResumeSchema.parse(json)
}

export function createResumeServer(options: CreateResumeServerOptions = {}) {
  const cwd = options.cwd ?? process.cwd()
  const summaryKey = options.summaryKey ?? 'default'
  const roleKey = options.roleKey ?? 'staffplus'

  return http.createServer(async (req, res) => {
    try {
      if (!req.url || !req.method) {
        res.statusCode = 400
        res.end('Bad Request')
        return
      }

      const url = new URL(req.url, 'http://localhost')

      if (req.method !== 'GET') {
        res.statusCode = 405
        res.setHeader('content-type', 'text/plain; charset=utf-8')
        res.end('Method Not Allowed')
        return
      }

      if (url.pathname !== '/' && url.pathname !== '/index.html') {
        res.statusCode = 404
        res.setHeader('content-type', 'text/plain; charset=utf-8')
        res.end('Not Found')
        return
      }

      const inputPath =
        options.inputPath ?? (await findDefaultInput(cwd))
      const resume = await loadResume(inputPath)
      const html = await renderHtml(resume, {
        summaryKey,
        roleKey,
        templatePath: options.templatePath,
      })

      res.statusCode = 200
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(html)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      res.statusCode = 500
      res.setHeader('content-type', 'text/plain; charset=utf-8')
      res.end(`Internal Server Error: ${message}`)
    }
  })
}
