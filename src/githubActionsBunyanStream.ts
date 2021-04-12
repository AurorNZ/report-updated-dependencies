import {ERROR, INFO, Stream, WARN} from 'bunyan'
import {BunyanRecord} from 'renovate/dist/logger/utils'
import * as core from '@actions/core'
import {Writable} from 'stream'

class GithubActionsStream extends Writable {
  constructor() {
    super({
      objectMode: true
    })
  }

  _write(rec: BunyanRecord, _: unknown, next: () => void): void {
    if (rec.level < INFO) {
      core.debug(rec.msg)
    } else if (rec.level < WARN) {
      core.info(rec.msg)
    } else if (rec.level < ERROR) {
      core.warning(rec.msg)
    } else {
      core.error(rec.msg)
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
