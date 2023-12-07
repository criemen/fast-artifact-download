import fs from 'fs/promises'
import {DownloadArtifactOptions} from '@actions/artifact'
import type {FindOptions} from '@actions/artifact'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import * as core from '@actions/core'
import {requestLog} from '@octokit/plugin-request-log'

async function streamExtract(
  ripunzip: string,
  url: string,
  directory: string
): Promise<void> {
  return exec.exec(ripunzip, ['unzip-uri', '-d', directory, url]).then(() => {})
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
  ripunzip: string,
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

  const api = github.getOctokit(token, undefined, requestLog)

  core.info(
    `Downloading artifact '${artifactId}' from '${repositoryOwner}/${repositoryName}'`
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function fetchWithManualRedirect(url: any, options: any) {
    return fetch(url, {...options, redirect: 'manual'})
  }
  const {headers, status} = await api.rest.actions.downloadArtifact({
    owner: repositoryOwner,
    repo: repositoryName,
    artifact_id: artifactId,
    archive_format: 'zip',
    request: {
      fetch: fetchWithManualRedirect
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
    await streamExtract(ripunzip, location, downloadPath)
    core.info(`Artifact download completed successfully.`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return downloadPath
}

export async function fastDownloadArtifact(
  ripunzip: string,
  artifactId: number,
  options: DownloadArtifactOptions & Required<FindOptions>
): Promise<void> {
  try {
    const {
      findBy: {repositoryOwner, repositoryName, token},
      ...downloadOptions
    } = options

    return downloadArtifactPublic(
      ripunzip,
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
