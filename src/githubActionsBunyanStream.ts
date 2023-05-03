import {ERROR, INFO, Stream, WARN} from 'bunyan'
import {BunyanRecord} from 'renovate/dist/logger/types'
import * as core from '@actions/core'
import {Writable} from 'stream'

const messagesToIgnore = ['RE2 not usable, falling back to RegExp']

class GithubActionsStream extends Writable {
  constructor() {
    super({
      objectMode: true
    })
  }

  _write(rec: BunyanRecord, _: unknown, next: () => void): void {
    if (messagesToIgnore.includes(rec.msg)) {
      next()
      return
    }

    const context = rec.module ? `[${rec.module}] ` : ''
    const msg = `${context}${rec.msg}`

    if (rec.level < INFO) {
      core.debug(msg)
    } else if (rec.level < WARN) {
      core.info(msg)
    } else if (rec.level < ERROR) {
      core.warning(msg)
    } else {
      core.error(msg)
    }

    next()
  }
}

export function createGithubActionsBunyanStream(): Stream {
  return {
    name: 'github-actions',
    level: 'debug',
    stream: new GithubActionsStream(),
    type: 'raw'
  }
}
