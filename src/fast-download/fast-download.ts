import {DownloadArtifactOptions} from '@actions/artifact'
import type {FindOptions} from '@actions/artifact'
import fs from 'fs/promises'

import * as github from '@actions/github'
import * as io from '@actions/io'
import * as exec from '@actions/exec'
import * as core from '@actions/core'

async function streamExtract(url: string, directory: string): Promise<void> {
  const ripunzip = await io.which('ripunzip', true)
  if (ripunzip) {
    return exec
      .exec(ripunzip, ['unzip-uri', '-d', directory, url])
      .then(() => {})
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false
    } else {
      throw error
    }
  }
}

async function resolveOrCreateDirectory(downloadPath: string): Promise<string> {
  if (!(await exists(downloadPath))) {
    core.debug(
      `Artifact destination folder does not exist, creating: ${downloadPath}`
    )
    await fs.mkdir(downloadPath, {recursive: true})
  } else {
    core.debug(`Artifact destination folder already exists: ${downloadPath}`)
  }

  return downloadPath
}

const scrubQueryParameters = (url: string): string => {
  const parsed = new URL(url)
  parsed.search = ''
  return parsed.toString()
}

export async function downloadArtifactPublic(
  artifactId: number,
  repositoryOwner: string,
  repositoryName: string,
  token: string,
  options?: DownloadArtifactOptions
): Promise<string> {
  if (!options?.path) {
    throw new Error(`Path is required`)
  }
  const downloadPath = await resolveOrCreateDirectory(options.path)

  const api = github.getOctokit(token)

  core.info(
    `Downloading artifact '${artifactId}' from '${repositoryOwner}/${repositoryName}'`
  )

  const {headers, status} = await api.rest.actions.downloadArtifact({
    owner: repositoryOwner,
    repo: repositoryName,
    artifact_id: artifactId,
    archive_format: 'zip',
    request: {
      redirect: 'manual'
    }
  })

  if (status !== 302) {
    throw new Error(`Unable to download artifact. Unexpected status: ${status}`)
  }

  const {location} = headers
  if (!location) {
    throw new Error(`Unable to redirect to artifact download url`)
  }

  core.info(
    `Redirecting to blob download url: ${scrubQueryParameters(location)}`
  )

  try {
    core.info(`Starting download of artifact to: ${downloadPath}`)
    await streamExtract(location, downloadPath)
    core.info(`Artifact download completed successfully.`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return downloadPath
}

export async function fastDownloadArtifact(
  artifactId: number,
  options: DownloadArtifactOptions & Required<FindOptions>
): Promise<void> {
  try {
    const {
      findBy: {repositoryOwner, repositoryName, token},
      ...downloadOptions
    } = options

    return downloadArtifactPublic(
      artifactId,
      repositoryOwner,
      repositoryName,
      token,
      downloadOptions
    ).then(() => {})
  } catch (error) {
    core.warning(
      `Download Artifact failed with error: ${error}.

Errors can be temporary, so please try again and optionally run the action with debug mode enabled for more information.

If the error persists, please check whether Actions and API requests are operating normally at [https://githubstatus.com](https://www.githubstatus.com).`
    )

    throw error
  }
}
