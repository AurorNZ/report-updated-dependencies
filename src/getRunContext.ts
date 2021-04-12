import {context} from '@actions/github'
import {PullRequestEvent, PushEvent} from '@octokit/webhooks-definitions/schema'

export interface RunContext {
  pullRequestNumber?: number
  baseSha: string
  headSha: string
  repo: {
    owner: string
    repo: string
  }
}

export function getRunContext(): RunContext {
  const repo = context.repo
  switch (context.eventName) {
    case 'pull_request': {
      const pullRequestPayload = context.payload as PullRequestEvent
      const {
        pull_request: {
          number: pullRequestNumber,
          base: {sha: baseSha},
          head: {sha: headSha}
        }
      } = pullRequestPayload
      return {
        baseSha,
        headSha,
        pullRequestNumber,
        repo
      }
    }

    case 'push': {
      const pushPayload = context.payload as PushEvent

      return {
        baseSha: pushPayload.before,
        headSha: context.sha,
        repo
      }
    }

    default:
      throw new Error(
        `The action can out run on ['pull_request', 'push'] workflow events. Please ensure your workflow is only triggered by those events or run this step/job conditionally https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions`
      )
  }
}
