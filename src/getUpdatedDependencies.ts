import {
  PackageDependency,
  PackageFile
} from 'renovate/dist/modules/manager/types'
import type {UpdatedDependency} from './types'

export function* getUpdatedDependencies(
  baseDependencies: Record<string, PackageFile[]>,
  headDependencies: Record<string, PackageFile[]>
): IterableIterator<UpdatedDependency> {
  for (const managerName in baseDependencies) {
    const basePackageList = baseDependencies[managerName]
    const headPackageList = headDependencies[managerName]

    if (
      !headPackageList ||
      headPackageList.length === 0 ||
      basePackageList.length === 0
    ) {
      continue
    }

    for (const basePackage of basePackageList) {
      const headPackage = headPackageList.find(
        x => x.packageFile === basePackage.packageFile
      )

      if (!headPackage) {
        // the package seems to be removed from the head
        continue
      }

      for (const baseDependency of basePackage.deps) {
        const matchingHeadDependencies = headPackage.deps.filter(
          x =>
            x.depName === baseDependency.depName &&
            x.depType === baseDependency.depType
        )

        // skip if headPackage contains an exact match on name, type and version
        if (
          matchingHeadDependencies.some(x => isSameVersion(x, baseDependency))
        ) {
          continue
        }

        const headDependency = matchingHeadDependencies[0]

        if (!headDependency) {
          // the dependency seems to be removed from the head
          continue
        }

        if (!isSameVersion(baseDependency, headDependency)) {
          if (!baseDependency.updates || baseDependency.updates.length === 0) {
            continue
          }

          yield {
            manager: managerName,
            packageFile: basePackage,
            update: {
              newValue:
                headDependency.currentValue ||
                headDependency.currentRawValue ||
                '',
              newVersion:
                headDependency.currentVersion ||
                headDependency.currentValue ||
                headDependency.currentRawValue ||
                undefined
            },
            dependency: baseDependency
          }
        }
      }
    }
  }
}

function isSameVersion(
  a: PackageDependency<Record<string, unknown>>,
  b: PackageDependency<Record<string, unknown>>
): boolean {
  if (a.currentValue && b.currentValue) {
    return a.currentValue === b.currentValue
  }

  return a.currentRawValue === b.currentRawValue
}
