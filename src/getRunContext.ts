import {context} from '@actions/github'

export interface RunContext {
  pullRequestNumber?: number
  baseRef: string
  headRef: string
  repo: {
    owner: string
    repo: string
  }
}

export function getRunContext(): RunContext {
  const repo = context.repo
  switch (context.eventName) {
    case 'pull_request': {
      const pullRequestPayload = context.payload

      const {pull_request} = pullRequestPayload
      if (!pull_request) {
        throw new Error(
          'Github event is malformed, expected pull_request context on pull_request event'
        )
      }

      const {number: pullRequestNumber, merge_commit_sha} = pull_request

      return {
        // github actions usually checkout merge commits when PR is merge into the target branch
        // `${context.sha}^` will get the first parent commit ßwhich will me the head of target branch for this PR
        baseRef: `${merge_commit_sha}^`,
        headRef: merge_commit_sha,
        pullRequestNumber,
        repo
      }
    }

    case 'push': {
      const pushPayload = context.payload

      return {
        baseRef: pushPayload.before,
        headRef: pushPayload.after,
        repo
      }
    }

    default:
      throw new Error(
        `The action can out run on ['pull_request', 'push'] workflow events. Please ensure your workflow is only triggered by those events or run this step/job conditionally https://docs.github.com/en/actions/reference/context-and-expression-syntax-for-github-actions`
      )
  }
}
