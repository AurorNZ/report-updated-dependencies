type Octokit = ReturnType<typeof import('@actions/github')['getOctokit']>

export async function upsertPrComment(
  github: Octokit,
  repo: {
    owner: string
    repo: string
  },
  pullRequestNumber: number,
  title: string,
  body: string
): Promise<void> {
  const existingComment = await findExistingComment(
    github,
    repo,
    pullRequestNumber,
    title
  )

  if (body.length >= 65536) {
    const truncated = '\n\n\n...long comment body truncated...'
    body = body.substr(0, 65536 - truncated.length) + truncated
  }

  if (existingComment) {
    await github.issues.updateComment({
      ...repo,
      comment_id: existingComment.id,
      body
    })
  } else {
    await github.issues.createComment({
      ...repo,
      issue_number: pullRequestNumber,
      body
    })
  }
}

export async function ensurePrCommentRemoved(
  github: Octokit,
  repo: {
    owner: string
    repo: string
  },
  pullRequestNumber: number,
  title: string
): Promise<void> {
  const existingComment = await findExistingComment(
    github,
    repo,
    pullRequestNumber,
    title
  )

  if (existingComment) {
    await github.issues.deleteComment({
      ...repo,
      issue_number: pullRequestNumber,
      comment_id: existingComment.id
    })
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function findExistingComment(
  github: Octokit,
  repo: {
    owner: string
    repo: string
  },
  pullRequestNumber: number,
  title: string
) {
  const existingCommentsResponse = await github.issues.listComments({
    ...repo,
    issue_number: pullRequestNumber
  })

  const existingComment = existingCommentsResponse.data.find(x =>
    x.body?.startsWith(title)
  )
  return existingComment
}
