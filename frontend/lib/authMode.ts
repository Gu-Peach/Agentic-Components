const DEFAULT_WORKSPACE_ID = 'demo-factory';

export function isAuthBypassedForDev(): boolean {
  return process.env.BYPASS_AUTH_FOR_SCENE_DEV !== 'false';
}

export function getDefaultWorkspacePath(): string {
  return `/workspace/${DEFAULT_WORKSPACE_ID}`;
}
