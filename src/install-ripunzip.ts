import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'
import {join} from 'path'
import * as fs from 'fs'

function getDownloadUrl(): string {
  switch (process.platform) {
    case 'win32':
      return 'https://github.com/criemen/fast-artifact-download/releases/download/ripunzip/ripunzip-win-amd64.exe'
    case 'darwin':
      return 'https://github.com/criemen/fast-artifact-download/releases/download/ripunzip/ripunzip-macos'
    case 'linux':
      return 'https://github.com/criemen/fast-artifact-download/releases/download/ripunzip/ripunzip-linux-amd64'
    default:
      throw new Error('Unsupported platform')
  }
}

export async function downloadAndCacheRipunzip(): Promise<string> {
  const url = getDownloadUrl()
  core.info(`Downloading ripunzip from ${url}`)
  const downloadPath = await tc.downloadTool(url)
  const cachedPath = await tc.cacheFile(
    downloadPath,
    'ripunzip.exe',
    'ripunzip.exe',
    '1.1.0'
  )
  core.info(`Cached ripunzip @ ${cachedPath}`)
  return cachedPath
}

export async function getRipunzip(): Promise<string> {
  // core.startGroup('Acquiring ripunzip')
  return ''
  // let cachedPath = tc.find('ripunzip.exe', '1.1.0')
  // try {
  //   if (cachedPath) {
  //     core.info(`Found in cache @ ${cachedPath}`)
  //   } else {
  //     cachedPath = await downloadAndCacheRipunzip()
  //   }
  //   const ripunzip = join(cachedPath, 'ripunzip.exe')
  //   fs.chmodSync(ripunzip, '755')
  //   return ripunzip
  // } finally {
  //   core.endGroup()
  // }
}
