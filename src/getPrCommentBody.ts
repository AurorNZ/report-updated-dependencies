import {PackageDependency} from 'renovate/dist/manager/types'
import {ChangeLogResult} from 'renovate/dist/workers/pr/changelog'
import {sanitizeMarkdown} from 'renovate/dist/util/markdown'
import type {UpdatedDependency} from './types'

export const commentTitle = '# Dependency updates summary'
const footer =
  '\n---\n\nThis comment content is generated by [Renovate Bot](https://github.com/renovatebot/renovate)'

export function getPrCommentBody(dependencies: UpdatedDependency[]): string {
  const anyChangeLogs = dependencies.some(x => x.changelog)
  const content = dependencies.map(getDependencyChangeContent)

  const releaseNotes = anyChangeLogs
    ? `
---

### Release notes
${content.map(x => x.changelog).join('\n\n')}
`
    : ''

  return `${commentTitle}
This PR contains the following updates:
<table>

${content.map(x => x.tableRow).join('\n\n')}

</table>

${releaseNotes}

${footer}`
}

function getDependencyChangeContent({
  dependency,
  update,
  changelog
}: UpdatedDependency): {tableRow: string; changelog: string} {
  const dependencyLink = getDependencyNameLinked(dependency)
  const type = dependency.prettyDepType ?? dependency.depType
  const from = update.displayFrom ?? update.currentVersion
  const to = update.displayTo ?? update.newVersion

  const change = `<code>${from}</code> → <code>${to}</code>`

  return {
    tableRow: `<tr>
<td>${dependencyLink}</td>
<td>${type}</td>
<td>${change}</td>
</tr>
`,
    changelog: `<details><summary>${dependency.depName}</summary>
  ${getReleaseNotes(dependencyLink, changelog)}</details>`
  }
}

function getReleaseNotes(
  dependencyLink: string,
  changelog: ChangeLogResult | undefined
): string {
  const releases =
    changelog?.versions?.map(x => {
      const versionWithPrefix = x.version.startsWith('v')
        ? x.version
        : `v${x.version}`

      const header = x.releaseNotes
        ? `### [\`${versionWithPrefix}\`](${x.releaseNotes.url})`
        : `### \`${versionWithPrefix}\``

      return `${header}
${x.compare.url ? `[Compare Source](${x.compare.url})` : ''}
${x.releaseNotes?.body ?? ''}`
    }) ?? []

  if (releases.length === 0) {
    return `<blockquote></p><p>No changelog found, please review changelog from official resources of ${dependencyLink}</blockquote>`
  }

  return sanitizeMarkdown(`
<blockquote>
<p></p>

${releases.join('\n\n')}

</blockquote>`)
}

function getDependencyNameLinked({
  depName,
  homepage,
  sourceUrl,
  dependencyUrl,
  changelogUrl
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
PackageDependency & Record<string, any>): string {
  let depNameLinked = depName || ''
  const primaryLink = homepage || sourceUrl || dependencyUrl
  if (primaryLink) {
    depNameLinked = `<a href="${primaryLink}">${depNameLinked}</a>`
  }
  const otherLinks = []
  if (homepage && sourceUrl) {
    otherLinks.push(`<a href="${sourceUrl}">source</a>`)
  }
  if (changelogUrl) {
    otherLinks.push(`<a href="${changelogUrl}">changelog</a>`)
  }
  if (otherLinks.length) {
    depNameLinked += ` (${otherLinks.join(', ')})`
  }

  return depNameLinked
}
