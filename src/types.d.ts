import {
  LookupUpdate,
  PackageDependency,
  PackageFile
} from 'renovate/dist/manager/types'
import {ChangeLogResult} from 'renovate/dist/workers/pr/changelog'

export interface UpdatedDependency {
  manager: string
  packageFile: PackageFile
  dependency: PackageDependency<Record<string, unknown>>
  update: LookupUpdate
}

export interface UpdatedDependencyWithChangelog extends UpdatedDependency {
  changelog: ChangeLogResult | null
}
