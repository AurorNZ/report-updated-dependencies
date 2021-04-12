import {addStream} from 'renovate/dist/logger'
import {createGithubActionsBunyanStream} from './githubActionsBunyanStream'

addStream(createGithubActionsBunyanStream())
