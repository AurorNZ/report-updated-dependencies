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
  const existingCommentsResponse = await github.issues.listComments({
    ...repo,
    issue_number: pullRequestNumber
  })

  const [existingComment] = existingCommentsResponse.data.filter(x =>
    x.body?.startsWith(title)
  )

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
